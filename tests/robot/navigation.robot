*** Settings ***
Documentation    Acceptance coverage for the primary navigation bar (six tabs, in
...              the final PR #25 order: Home, Blog, Decks, Work, About, Contact)
...              and the Home page's "Latest Posts" / "Latest Decks" sections with
...              their "View all" links. Per-tab destination coverage lives in
...              navigation-tabs.robot as a templated, data-driven suite.
Resource         resources/site.resource
Suite Setup      Open Browser To Page    /
Suite Teardown   Close Browser Session
Test Setup       Given A Visitor Is On The Home Page

*** Test Cases ***
Primary Navigation Lists All Six Tabs In The Expected Order
  [Documentation]    PR #25 replaced the "Projects" tab with "Decks" and
  ...    reordered the bar. The nav must show exactly these six tabs, in
  ...    this order, with no leftover "Projects" tab.
  ${labels}=    Get Primary Navigation Labels
  Lists Should Be Equal    ${labels}    ${EXPECTED_NAV_TABS}

Home Page Latest Posts Section Lists Posts With A Working View All Link
  ${count}=    Get Latest Section Item Count    Latest Posts
  Should Be True    ${count} >= 1    Latest Posts section shows no post cards
  Click View All Link For Section    Latest Posts
  Wait Until Location Contains    /blog    timeout=10 seconds
  ${heading}=    Get Page Heading
  Should Be Equal As Strings    ${heading}    Blog

Home Page Latest Decks Section Lists Decks With A Working View All Link
  ${count}=    Get Latest Section Item Count    Latest Decks
  Should Be True    ${count} >= 1    Latest Decks section shows no deck cards
  Click View All Link For Section    Latest Decks
  Wait Until Location Contains    /slides    timeout=10 seconds
  ${heading}=    Get Page Heading
  Should Be Equal As Strings    ${heading}    Decks
