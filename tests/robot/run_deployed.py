"""Run the Robot suites against a deployed site (BASE_URL), allowing for
Netlify's bot challenge.

Netlify sometimes answers automated browsers on *.netlify.app with a
"We are verifying your connection" page. A test that fails because of it is
tagged netlify-challenge by resources/NetlifyChallenge.py; those tests, and
only those, are rerun after a pause, and the runs are merged into one
report. Any other failure is reported as a failure, and a test still
challenged after the last retry still fails the run.

Usage: python tests/robot/run_deployed.py [robot options]
Env:   NETLIFY_CHALLENGE_WAIT (seconds, default 60),
       NETLIFY_CHALLENGE_RETRIES (default 2),
       ROBOT_OUTPUT_DIR (default robot-results/deployed)
"""
import os
import re
import subprocess
import sys
import time
from pathlib import Path

from robot.api import ExecutionResult

CHALLENGE_TAG = 'netlify-challenge'
SUITE_DIR = Path(__file__).resolve().parent


def classify(output):
    """Return (challenged, real) full names of the failed tests in an output file."""
    challenged, real = [], []
    for test in ExecutionResult(str(output)).suite.all_tests:
        if test.status == 'FAIL':
            (challenged if CHALLENGE_TAG in test.tags else real).append(test.full_name)
    return challenged, real


def test_selectors(names):
    """--test options selecting exactly these tests; *, ? and [ ] are escaped."""
    selectors = []
    for name in names:
        selectors += ['--test', re.sub(r'([*?\[\]])', r'[\1]', name)]
    return selectors


def main(robot_args):
    out_dir = Path(os.environ.get('ROBOT_OUTPUT_DIR', 'robot-results/deployed'))
    out_dir.mkdir(parents=True, exist_ok=True)
    wait = int(os.environ.get('NETLIFY_CHALLENGE_WAIT', '60'))
    retries = int(os.environ.get('NETLIFY_CHALLENGE_RETRIES', '2'))
    outputs = []

    def run(number, extra):
        output = out_dir / f'run-{number}.xml'
        subprocess.run([sys.executable, '-m', 'robot', '--outputdir', str(out_dir), '--output', output.name,
                        '--log', 'NONE', '--report', 'NONE', *robot_args, *extra, str(SUITE_DIR)], check=False)
        outputs.append(output)
        return classify(output)

    challenged, real = run(1, [])
    for attempt in range(retries):
        if not challenged:
            break
        print(f'\n{len(challenged)} test(s) hit Netlify\'s bot challenge; waiting {wait}s, then rerunning only those '
              f'(retry {attempt + 1} of {retries}).\n')
        time.sleep(wait)
        challenged, still_failing = run(attempt + 2, test_selectors(challenged))
        real += still_failing

    subprocess.run([sys.executable, '-m', 'robot.rebot', '--merge', '--outputdir', str(out_dir),
                    '--output', 'output.xml', *map(str, outputs)], check=False)

    if challenged:
        print(f'\nStill challenged by Netlify after {retries} retries: {", ".join(challenged)}')
    if real:
        print(f'\nFailed: {", ".join(real)}')
    return 1 if challenged or real else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
