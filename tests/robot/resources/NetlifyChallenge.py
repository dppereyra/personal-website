"""HTTP fetching for the Robot suites that recognises Netlify's bot challenge.

Netlify can answer automated traffic on *.netlify.app with a "We are verifying
your connection" page instead of the site. When it does, the fetch fails with a
message naming the challenge, so the suites' Test Teardown (Note Netlify
Challenge If The Test Failed) can label the failure and run_deployed.py can
rerun it. Nothing here tries to get past the challenge.
"""
import urllib.error
import urllib.request

MARKER = 'We are verifying your connection'


class NetlifyChallenge:
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'

    def fetch_url_identified_as(self, url, user_agent):
        """GET url with the given User-Agent and return the urllib response.

        Fails with a message naming the challenge when Netlify serves its
        bot challenge instead of the page; other HTTP errors propagate as
        urllib raises them ("HTTP Error <code>: ...").
        """
        request = urllib.request.Request(url, headers={'User-Agent': user_agent})
        try:
            return urllib.request.urlopen(request, timeout=15)
        except urllib.error.HTTPError as error:
            body = error.read().decode('utf-8', 'replace')
            if MARKER in body:
                raise AssertionError(f'Netlify bot challenge served for {url} (HTTP {error.code})') from None
            raise
