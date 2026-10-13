"""Unit tests for run_deployed.py, the deployed-site Robot runner.

Run with: python -m unittest discover -s tests/robot -p 'test_*.py'
They execute small generated Robot suites through robot.api, so the result
files they classify are real Robot output, not hand-written XML.
"""
import tempfile
import unittest
from pathlib import Path

from robot.api import TestSuite

import run_deployed


def run_suite(tests, output):
    """Run a generated suite; tests is a list of (name, fails, tags)."""
    suite = TestSuite('Robot')
    child = suite.suites.create('Navigation-Tabs')
    for name, fails, tags in tests:
        test = child.tests.create(name, tags=tags)
        if fails:
            test.body.create_keyword('Fail', args=[f'{name} failed'])
        else:
            test.body.create_keyword('No Operation')
    suite.run(output=str(output), log=None, report=None, stdout=open('/dev/null', 'w'))
    return output


class ClassifyTest(unittest.TestCase):
    def test_separates_challenge_failures_from_real_ones(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = run_suite([
                ('Home Tab Loads The Home Page', False, []),
                ('Blog Tab Loads The Blog Listing', True, [run_deployed.CHALLENGE_TAG]),
                ('Work Tab Loads The Work Page', True, []),
            ], Path(tmp) / 'output.xml')
            challenged, real = run_deployed.classify(output)
        self.assertEqual(challenged, ['Robot.Navigation-Tabs.Blog Tab Loads The Blog Listing'])
        self.assertEqual(real, ['Robot.Navigation-Tabs.Work Tab Loads The Work Page'])

    def test_a_clean_run_has_nothing_to_rerun(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = run_suite([('Home Tab Loads The Home Page', False, [])], Path(tmp) / 'output.xml')
            self.assertEqual(run_deployed.classify(output), ([], []))


class TestSelectorTest(unittest.TestCase):
    def test_selects_exactly_the_named_tests(self):
        self.assertEqual(
            run_deployed.test_selectors(['Robot.Sitemap.The Production Site Publishes A Sitemap Of Its Pages']),
            ['--test', 'Robot.Sitemap.The Production Site Publishes A Sitemap Of Its Pages'],
        )

    def test_escapes_robot_name_pattern_characters(self):
        # --test treats *, ? and [ ] as patterns; a literal name must not.
        self.assertEqual(
            run_deployed.test_selectors(['Robot.Suite.Does [this] work? *really*']),
            ['--test', 'Robot.Suite.Does [[]this[]] work[?] [*]really[*]'],
        )


if __name__ == '__main__':
    unittest.main()
