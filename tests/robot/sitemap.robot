*** Settings ***
Documentation    Acceptance coverage for the generated XML sitemap. Only the real
...              production site (dppereyra.com) publishes one, listing the
...              site's real pages — posts and decks included — so search engines
...              can discover them. Every other surface (staging, deploy previews,
...              local builds) is disallowed in robots.txt, and must not publish a
...              sitemap advertising its own hostname. Which half applies is
...              decided by ${BASE_URL}. Like security-headers.robot, these fetch
...              ${BASE_URL} directly rather than through the browser.
Resource         resources/site.resource

*** Test Cases ***
The Production Site Publishes A Sitemap Of Its Pages
  Skip If    not ${IS_PRODUCTION_SITE}    Sitemap is production-only; see the next case
  ${response}=    Fetch Url    ${BASE_URL}/sitemap-index.xml
  ${body}=    Read Response Text    ${response}
  Should Contain    ${body}    <sitemapindex
  Should Match Regexp    ${body}    <loc>https://www\\.dppereyra\\.com/sitemap-0\\.xml</loc>
  ${response}=    Fetch Url    ${BASE_URL}/sitemap-0.xml
  ${body}=    Read Response Text    ${response}
  FOR    ${path}    IN    /blog/    /slides/    /about/    /blog/welcome/    /slides/welcome/
    Should Contain    ${body}    <loc>https://www.dppereyra.com${path}</loc>
    ...    Sitemap does not list ${path}
  END

Other Surfaces Publish No Sitemap
  Skip If    ${IS_PRODUCTION_SITE}    Only non-production surfaces must omit the sitemap
  ${status}=    Get Url Status    ${BASE_URL}/sitemap-index.xml
  Should Be Equal As Integers    ${status}    404
  ...    A non-production build published a sitemap advertising its own hostname
