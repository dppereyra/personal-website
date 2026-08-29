*** Settings ***
Documentation    Data-driven acceptance coverage: each of the six primary nav
...              tabs must load its own page, identified by URL and by that
...              page's <h1>. Kept as its own templated suite so the template
...              doesn't have to be shared with navigation.robot's non-templated
...              cases.
Resource         resources/site.resource
Suite Setup      Open Browser To Page    /
Suite Teardown   Close Browser Session
Test Setup       Given A Visitor Is On The Home Page
Test Template    Navigating To A Primary Nav Tab Should Load Its Page

*** Test Cases ***             LABEL      EXPECTED PATH    EXPECTED HEADING
Home Tab Loads The Home Page                Home       /                Home
Blog Tab Loads The Blog Listing             Blog       /blog            Blog
Decks Tab Loads The Decks Listing           Decks      /slides          Decks
Work Tab Loads The Work Page                Work       /work            Work History
About Tab Loads The About Page              About      /about           About Me
Contact Tab Loads The Contact Page          Contact    /contact         Contact Me

*** Keywords ***
Navigating To A Primary Nav Tab Should Load Its Page
  [Arguments]    ${label}    ${expected_path}    ${expected_heading}
  Click Primary Navigation Tab    ${label}
  Wait Until Location Contains    ${expected_path}    timeout=10 seconds
  ${heading}=    Get Page Heading
  Should Be Equal As Strings    ${heading}    ${expected_heading}
