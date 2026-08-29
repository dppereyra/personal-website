*** Settings ***
Documentation    Business-language keywords for site navigation, the Home page's
...              "latest" sections, and deck-detail page controls (PDF download,
...              View Deck / presentation mode). Built on top of common.resource's
...              browser lifecycle and URL helpers.
Resource         common.resource

*** Variables ***
@{EXPECTED_NAV_TABS}    Home    Blog    Decks    Work    About    Contact

*** Keywords ***
# --- Navigation --------------------------------------------------------

Given A Visitor Is On The Home Page
  [Documentation]    Navigates the shared suite browser to the Home page and
  ...    waits for it to render.
  Go To    ${BASE_URL}/
  Wait Until Page Contains Element    css:h1    timeout=10 seconds

Get Primary Navigation Labels
  [Documentation]    Returns the visible text of every link in the primary nav,
  ...    in DOM order.
  ${elements}=    Get WebElements    css:nav.site-navbar ul.menu li a
  ${labels}=    Create List
  FOR    ${element}    IN    @{elements}
    ${text}=    Get Text    ${element}
    Append To List    ${labels}    ${text}
  END
  RETURN    ${labels}

Click Primary Navigation Tab
  [Documentation]    Clicks the primary nav link whose visible text matches
  ...    ${label} exactly (e.g. "Decks").
  [Arguments]    ${label}
  Click Element    xpath://nav[contains(@class,'site-navbar')]//a[normalize-space()='${label}']

Get Page Heading
  [Documentation]    Returns the text of the current page's top-level <h1>.
  ${heading}=    Get Text    css:h1
  RETURN    ${heading}

# --- Home page "latest" sections ---------------------------------------

Get Latest Section Item Count
  [Documentation]    Counts the article cards under the "Latest Posts" or
  ...    "Latest Decks" section, identified by its <h2> heading text.
  [Arguments]    ${section_heading}
  ${count}=    Get Element Count
  ...    xpath://h2[normalize-space()='${section_heading}']/ancestor::section[1]//article
  RETURN    ${count}

Click View All Link For Section
  [Documentation]    Clicks the "View all" link that sits alongside the given
  ...    section heading (e.g. "Latest Posts" -> /blog, "Latest Decks" -> /slides).
  [Arguments]    ${section_heading}
  Click Element    xpath://h2[normalize-space()='${section_heading}']/following-sibling::a[1]

# --- Deck detail page ----------------------------------------------------

Given A Visitor Opens The Welcome Deck Detail Page
  Go To    ${BASE_URL}/slides/welcome
  Wait Until Page Contains Element    id:view-deck-btn    timeout=10 seconds

Get Download PDF Link Url
  [Documentation]    Returns the absolute href of the deck detail page's
  ...    "Download PDF" control.
  ${url}=    Get Element Attribute    xpath://a[normalize-space()='Download PDF']    href
  RETURN    ${url}

Fetch Url
  [Documentation]    Performs a plain HTTP GET against ${url} (independent of the
  ...    browser session) and returns the urllib response object, so response
  ...    headers and body can be inspected directly.
  [Arguments]    ${url}
  ${response}=    Evaluate    __import__('urllib.request', fromlist=['request']).urlopen('''${url}''', timeout=15)
  RETURN    ${response}

Pdf Response Should Be Valid
  [Documentation]    Asserts an urllib response is a real, non-trivial PDF
  ...    document: HTTP 200, application/pdf content type, %PDF- magic bytes,
  ...    and a body too large to plausibly be an error page.
  [Arguments]    ${response}
  ${status}=    Call Method    ${response}    getcode
  Should Be Equal As Integers    ${status}    200
  ${content_type}=    Evaluate    $response.headers.get('Content-Type')
  Should Be Equal As Strings    ${content_type}    application/pdf
  ${body}=    Call Method    ${response}    read
  ${magic}=    Evaluate    $body[:5].decode('latin-1')
  Should Be Equal As Strings    ${magic}    %PDF-
  ${size}=    Get Length    ${body}
  Should Be True    ${size} > 1000    PDF response body is suspiciously small (${size} bytes)

When They Activate The View Deck Control
  Click Element    id:view-deck-btn
  Wait Until Element Is Visible    id:presentation-overlay    timeout=10 seconds

Then The Presentation Overlay Should Be Open
  Element Should Be Visible    id:presentation-overlay

Then The Presentation Overlay Should Be Closed
  Wait Until Element Is Not Visible    id:presentation-overlay    timeout=10 seconds

Then The Presentation Should Show A Slide
  Wait Until Page Contains Element    css:#presentation-slide svg    timeout=10 seconds

Get Current Presentation Slide Markup
  [Documentation]    Returns the outer markup currently rendered inside the
  ...    presentation slide container, used to detect that the displayed slide
  ...    actually changed after a navigation key press.
  ${markup}=    Get Element Attribute    css:#presentation-slide    outerHTML
  RETURN    ${markup}

When They Press The Right Arrow Key
  Press Keys    None    ARROW_RIGHT

When They Press The Escape Key
  Press Keys    None    ESCAPE

Close Presentation If Open
  [Documentation]    Teardown safeguard: closes the presentation overlay via
  ...    Escape if a failed assertion left it open, so it never leaks into the
  ...    next test.
  ${is_open}=    Run Keyword And Return Status    Element Should Be Visible    id:presentation-overlay
  IF    ${is_open}
    Press Keys    None    ESCAPE
    Wait Until Element Is Not Visible    id:presentation-overlay    timeout=5 seconds
  END
