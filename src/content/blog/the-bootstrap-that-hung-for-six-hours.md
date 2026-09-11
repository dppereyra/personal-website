---
title: 'The bootstrap that hung for six hours'
description: 'A silent VM provisioning failure, and what it taught me about Azure disks, drive letters, and trusting my own reasoning'
pubDate: 2026-09-12
tags: ['azure', 'terraform', 'powershell', 'sql-server', 'debugging']
ai-assisted: true
---

# The bootstrap that hung for six hours

I spent a day debugging a virtual machine that wouldn't finish building itself. The
setup is ordinary enough: Terraform provisions a SQL Server VM, and a long-lived
PowerShell script runs on first boot to install everything the application needs. It
had been working. Then we moved the VM from the Windows Server 2022 image to the 2025
one, and it stopped.

What made it interesting wasn't the bug. It was that I was confidently wrong three
times on the way to finding it, and each wrong answer looked exactly like a right one.

## A log that stops mid-sentence

The provisioning extension reported a timeout. The script's own log ended like this:

```
21:31:23 > Install <some utility> : START
```

Nothing after. No error, no stack trace, no "FAILED" line — and the script's error
handling is thorough enough that a thrown exception would have logged one. The process
itself ran for six hours and twelve minutes before exiting with code 1.

The first useful question was whether the script had stopped, or whether only the
*logging* had stopped. Those look identical from the outside and have completely
different causes. The script wrote its log locally and then pushed a copy to shared
storage, so I compared the two. Both ended at the same byte. The script had genuinely
stopped executing.

The second useful question was whether the step had actually failed. It hadn't — the
utility was installed. Files on disk, registry entry present, timestamped two seconds
after that last log line. The installer did its job and then never exited, so
`Start-Process -Wait` sat there waiting for a process that was never going to finish.

I reproduced it in isolation. A legacy installer — the kind that unpacks itself to a
temp directory and re-launches a child process — launched as `NT AUTHORITY\SYSTEM` in
session 0 completes all its work and then hangs indefinitely. On the old image, the
same installer finished in 67 seconds.

Two things to take from that. First, `Start-Process -Wait` is a promise you can't
keep: it waits for the process *and its descendants*, so one stuck child hangs the
whole script forever. The fix is a bounded wait that kills the process tree on timeout
and then confirms success by checking whether the product is actually installed,
rather than trusting an exit code that never arrives.

Second, the platform's timeout and your timeout are different things. Azure caps
custom-script extension provisioning at roughly 100 minutes regardless of what you
configure in Terraform. So the extension reported failure at the 100-minute mark while
the script carried on for another four and a half hours. If you're reading the
extension status, you're reading a fiction — the script is still going.

What eventually ended the run, incidentally, was unattended Windows Update installing
patches and rebooting the machine. That's worth knowing on its own: a fresh image will
patch and restart itself on its own schedule, right through whatever you're doing.

## Azure LUNs are not Windows LUNs

With the hang understood, the other half of the failure was the disks. Three separate
problems, and they stack.

The first was documented and I should have found it sooner. Azure's SQL Server IaaS
Agent can configure your data disks for you — initialise them, build a storage pool,
assign drive letters. It requires Premium SSD. It does **not** support Premium SSD v2,
and if your disks are v2 it fails. Worth checking your disk tier before reaching for
the automation.

The second was more interesting. You tell the agent which disks to use by LUN, which
seems unambiguous until you look at what Windows thinks. For NVMe-attached data disks,
the LUN Windows reports is **not** the LUN Azure attached the disk at. The enumeration
order differs, and worse, once the agent builds a storage pool out of one disk, the
resulting virtual disk can occupy the LUN number you were going to use for the next
one. The error reads:

```
Failed to get valid physical disks within given device ID range
```

Which is an accurate description of what happened and no help at all in working out
why.

The third was mine. In Terraform, the resource that registers the VM with the SQL
agent referenced the VM's ID — so it depended on the VM, but *not* on the disk
attachments. Both started at VM creation, in parallel. Storage configuration
occasionally won the race, looked for a disk at LUN 0, and found nothing:

```
Number of disks found do not match the expected count for creating Storage Pool, found :0
```

The fix is to depend on the whole VM module rather than one output, so the attachments
are part of the dependency. This is a general trap with Terraform: reading a single
output creates a dependency on that one resource, not on everything the module
contains. When a module produces things that must all exist before the next step,
`depends_on` the module.

## The D: drive that isn't a drive

Then the drive letters. The convention being reproduced put the database on `F:`, the
log on `G:`, and `tempdb` on `D:` — `D:` being the local ephemeral SSD, which is a
sensible place for temporary data you don't mind losing.

Except the VM size we'd chosen has no local disk at all. On those sizes `D:` is the
virtual DVD-ROM. I confirmed it on the machine: drive type 5, zero bytes, no media.
Asking the agent to put `tempdb` there produces:

```
Ext_StorageConfigurationSettings_ApplyNewTempDbSettingsError
"System Drive returned status not ready for use"
```

The obvious fix is the same size with local storage — the one variant letter in the
name. That's a trap. The current-generation sizes that *do* have a local disk present
it **raw and uninitialised**, and the vendor documents this as breaking SQL image
deployments outright, plus losing `tempdb` again after every restart or deallocation,
because the disk reverts to raw. There's a published list of affected sizes and the
guidance is to pick one without the local disk — which of course then can't host
`tempdb` on `D:` either.

What actually worked was going back a generation, to a size whose local SSD arrives
formatted. Same CPU and memory, a real `D:`, not on the impacted list. That felt like
a regression until I checked: this is the documented resolution.

I want to be honest about how I got there, because I nearly got it wrong. I'd
concluded from documentation that the original size couldn't work, and I was right —
but I hadn't *seen* it fail, because every earlier failure had a different cause. When
I finally tested the original size with everything else fixed, it failed with exactly
the error above. Inference and evidence agreed, but only one of them was worth acting
on, and I'd been acting on the wrong one for a while.

## Rebuilding, and the option that looked safe

One last piece, and it's my favourite because the intuitive answer is backwards.

The rebuild tooling had a flag: recreate the VM but keep the data disks. Obviously the
safer choice — you keep your data. It cannot work. Replacing the VM forces the SQL
registration resource to be recreated; its storage configuration runs in "create new"
mode; and the retained disks still have `F:` and `G:` on them. So:

```
"Volume with drive letter F already exist"
```

You could make the storage configuration conditional and skip it when the disks are
retained. The apply would go green. You'd have a broken instance. The default data and
log paths are *instance* settings, living in the registry on the OS disk — which you
just replaced. The volumes come back mounted with the old files on them while SQL
quietly points at `C:`.

So the disks aren't independently meaningful. They only make sense paired with the
configuration that lives on the OS disk, and the two have to be replaced together. We
deleted the option rather than documenting it, because an option that reads as the
cautious choice while being the broken one is worse than no option at all —
particularly for someone reaching for it mid-incident.

## What I'd actually take away

**Test it, don't reason about it.** I was wrong three times with good reasoning:
about the VM size (right conclusion, no evidence), about a login being missing (see
below), and about which of two conventions was intentional. Each time the fix was to
go and look.

**Permission-filtered queries lie.** At one point I reported that a required SQL login
didn't exist, having queried the system catalogue. It existed. I'd queried as an
account that wasn't a sysadmin, and those views silently show you only what you're
entitled to see. An empty result is not the same as an absent row, and nothing in the
output tells you which one you got.

**Check the history before you delete something.** I removed a component on the
premise that the image already provided it. It didn't, and the repository history
showed the inclusion had been deliberate from the first commit. Two minutes of `git
log` would have saved that round trip — and my follow-up justification, drawn from how
neighbouring systems behaved, was wrong too.

**Search the vendor's exact error string.** Every one of these had a published page
describing it precisely. `"System Drive returned status not ready for use"` leads
straight to the affected-size list. The generic-sounding messages are often verbatim
from documentation someone has already written.

**A stopped log is evidence, not an absence of evidence.** Comparing the local copy
against the shipped copy proved the script had died rather than lost its ability to
report. That one comparison saved chasing a logging problem that didn't exist.

The bootstrap now finishes in about eight minutes.
