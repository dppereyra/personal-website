*** Settings ***
Documentation    Acceptance coverage for the baseline HTTP security response
...              headers every representative response from this site must set:
...              X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and
...              Content-Security-Policy.
...
...              These checks are independent of any browser — like deck-detail
...              .robot's PDF content-type check, they fetch ${BASE_URL} directly
...              via urllib so the raw response headers can be inspected. Exact
...              CSP directive contents are intentionally not asserted here; that
...              policy's design is owned elsewhere (see the site's `public/
...              _headers` file) — this suite only guards that a real, non-empty
...              baseline is present on the homepage, on a representative feed,
...              and on a representative static asset.
Resource         resources/site.resource
Test Tags        deployed-only
Test Template    Response For A Requested Path Should Include Baseline Security Headers

*** Test Cases ***                                          PATH             DESCRIPTION
Homepage Response Includes Baseline Security Headers          /                the homepage
Rss Feed Response Includes Baseline Security Headers           /rss.xml         the site RSS feed
Static Asset Response Includes Baseline Security Headers       /favicon.svg     a static asset
