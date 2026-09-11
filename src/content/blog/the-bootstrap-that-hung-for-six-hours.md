---
title: 'The bootstrap that hung for six hours'
description: 'Debugging a silent Azure VM provisioning failure, and being wrong three times'
pubDate: 2026-09-12
tags: ['azure', 'terraform', 'powershell', 'sql-server', 'debugging']
ai-assisted: true
---

# The bootstrap that hung for six hours

An ordinary setup: Terraform provisions a SQL Server VM, and a PowerShell script runs
on first boot to install everything the application needs.

It worked. Then we moved from the Windows Server 2022 image to the 2025 one, and it
stopped — silently, for six hours at a time.

What made the day interesting wasn't the bug. It was that I was confidently wrong
three times on the way to finding it, and each wrong answer looked exactly like a
right one.

## What actually broke

Four separate faults, which is why it took a day rather than an hour:

1. A legacy installer that **completes its work and never exits** under `SYSTEM`
2. Automated SQL storage configuration that **doesn't support Premium SSD v2**
3. A Terraform dependency that let storage configuration **race the disk attachments**
4. A `tempdb` path pointing at `D:` on a VM size that **has no local disk**

Each one masked the next, so every fix revealed a new failure that looked like a
regression.

## A log that stops mid-sentence

The extension reported a timeout. The script's own log ended here:

```text
21:31:23 > Install <some utility> : START
```

Nothing after. No error, no stack trace, no `FAILED` line — and the error handling is
thorough enough that a thrown exception would have logged one. The process ran for six
hours and twelve minutes, then exited `1`.

### Did the script stop, or did the logging stop?

Those look identical from outside and have completely different causes. The script
wrote locally and then copied to shared storage, so I compared both. They ended at the
same byte. The script had genuinely stopped executing.

### Did the step fail?

No — the utility was installed. Files on disk, registry entry present, timestamped two
seconds after that last line. The installer did its job and then never exited, so
`Start-Process -Wait` sat waiting for a process that was never going to finish.

Reproduced in isolation: a legacy installer — the kind that unpacks itself to a temp
directory and re-launches a child — launched as `NT AUTHORITY\SYSTEM` in session 0
completes everything and hangs. On the old image, 67 seconds.

Two things worth carrying away:

- **`-Wait` is a promise you can't keep.** It waits for the process *and its
  descendants*, so one stuck child hangs the script forever. Use a bounded wait that
  kills the process tree, then confirm success by checking the product is installed
  rather than trusting an exit code that never arrives.
- **The platform's timeout isn't yours.** Azure caps custom-script provisioning at
  roughly 100 minutes regardless of what Terraform says. The extension reported
  failure at 100 minutes while the script carried on for another four and a half
  hours. If you're reading extension status, you're reading a fiction.

What finally ended the run was unattended Windows Update patching the box and
rebooting it. Worth knowing on its own: a fresh image will patch and restart itself on
its own schedule, straight through whatever you're doing.

## Azure LUNs are not Windows LUNs

### Premium SSD v2 isn't supported

Azure's SQL Server IaaS Agent can configure data disks for you — initialise them,
build a storage pool, assign drive letters. It requires Premium SSD. It does **not**
support Premium SSD v2, and fails if that's what you have.

Check your disk tier before reaching for the automation.

### The LUN you ask for isn't the LUN you get

You nominate disks by LUN, which seems unambiguous until you ask Windows. For
NVMe-attached data disks, the LUN Windows reports is *not* the LUN Azure attached at —
the enumeration order differs.

Worse: once the agent builds a pool from one disk, the resulting virtual disk can
occupy the LUN number you were going to use for the next one.

```text
Failed to get valid physical disks within given device ID range
```

An accurate description of what happened, and no help at all in working out why.

### A dependency that wasn't

This one was mine. The resource registering the VM with the agent referenced the VM's
ID — so it depended on the VM, but **not** on the disk attachments. Both started at VM
creation, in parallel. Storage configuration won the race, looked for LUN 0, and found
nothing:

```text
Number of disks found do not match the expected count for creating Storage Pool, found :0
```

The fix is to depend on the whole module rather than one output.

> Reading a single output creates a dependency on that one resource, not on everything
> the module contains. When a module produces things that must *all* exist first,
> `depends_on` the module.

## The D: drive that isn't a drive

The convention being reproduced put the database on `F:`, the log on `G:`, and
`tempdb` on `D:` — `D:` being the local ephemeral SSD, a sensible home for temporary
data you don't mind losing.

Except our VM size has no local disk. `D:` is the virtual DVD-ROM. Confirmed on the
machine: drive type 5, zero bytes, no media.

```text
Ext_StorageConfigurationSettings_ApplyNewTempDbSettingsError
"System Drive returned status not ready for use"
```

The obvious fix — the same size *with* local storage, one letter different in the name
— is a trap:

| size generation | local disk | `tempdb` on `D:`? |
|---|---|---|
| current, no local disk | none — `D:` is the DVD drive | no |
| current, with local disk | raw, uninitialised | no — breaks SQL images |
| previous, with local disk | arrives formatted | **yes** |

The current-generation sizes that do have a local disk present it raw, which the vendor
documents as breaking SQL image deployments outright *and* losing `tempdb` after every
restart or deallocation, because the disk reverts to raw. There's a published list of
affected sizes.

What worked was going back a generation: same CPU and memory, a real `D:`, not on the
impacted list. That felt like a regression until I checked — it's the documented
resolution.

I nearly got this wrong. I'd concluded from documentation that the original size
couldn't work, and I was right, but I hadn't *seen* it fail, because every earlier
failure had a different cause. When I finally tested it with everything else fixed, it
failed with exactly the error above. Inference and evidence agreed — but only one of
them was worth acting on, and I'd been acting on the wrong one.

## The rebuild option that looked safe

My favourite, because the intuitive answer is backwards.

The rebuild tooling had a flag: recreate the VM, keep the data disks. Obviously the
safer choice. It cannot work.

Replacing the VM forces the SQL registration to be recreated; its storage
configuration runs in "create new" mode; the retained disks still have `F:` and `G:`
on them:

```text
"Volume with drive letter F already exist"
```

You could make storage configuration conditional and skip it when disks are retained.
The apply would go green. **You'd have a broken instance** — the default data and log
paths are *instance* settings living in the registry on the OS disk, which you just
replaced. The volumes come back mounted with the old files while SQL quietly points at
`C:`.

So the disks aren't independently meaningful. They only make sense paired with the
configuration on the OS disk, and the two have to be replaced together.

We deleted the option rather than documenting it. An option that reads as the cautious
choice while being the broken one is worse than no option at all — particularly for
someone reaching for it mid-incident.

## What I'd take away

**Test it, don't reason about it.** I was wrong three times with good reasoning: about
the VM size (right conclusion, no evidence), about a missing login, and about which of
two conventions was intentional. Each time the fix was to go and look.

**Permission-filtered queries lie.** I reported that a required SQL login didn't exist,
having queried the system catalogue. It existed — I'd queried as a non-sysadmin, and
those views silently show only what you're entitled to see. An empty result is not an
absent row, and nothing in the output distinguishes them.

**Check the history before deleting something.** I removed a component believing the
image already provided it. It didn't, and the repository history showed the inclusion
had been deliberate since the first commit. Two minutes of `git log` would have saved
the round trip — and my follow-up justification, drawn from how neighbouring systems
behaved, was wrong too.

**Search the vendor's exact error string.** Every one of these had a published page
describing it precisely. The generic-sounding messages are often verbatim from
documentation someone has already written.

**A stopped log is evidence, not an absence of it.** Comparing the local copy against
the shipped copy proved the script had died rather than lost its ability to report.
That one comparison saved chasing a logging problem that didn't exist.

The bootstrap now finishes in about eight minutes.
