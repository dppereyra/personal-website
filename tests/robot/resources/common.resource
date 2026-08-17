*** Settings ***
Library    Collections
Library    SeleniumLibrary    timeout=10 seconds    run_on_failure=Capture Page Screenshot
Library    String

*** Variables ***
${BASE_URL}             http://127.0.0.1:4321
${BROWSER}              %{BROWSER=chrome}
${HEADLESS_ARG}         --headless=new

*** Keywords ***
Open Browser To Page
  [Arguments]    ${path}=/
  ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions() if $BROWSER == 'chrome' else sys.modules['selenium.webdriver'].FirefoxOptions()    modules=sys, selenium.webdriver
  IF    '${BROWSER}' == 'chrome'
    Call Method    ${options}    add_argument    ${HEADLESS_ARG}
    Call Method    ${options}    add_argument    --no-sandbox
    Call Method    ${options}    add_argument    --disable-dev-shm-usage
    Create Webdriver    Chrome    options=${options}
  ELSE
    Call Method    ${options}    add_argument    --headless
    Create Webdriver    Firefox    options=${options}
  END
  Set Selenium Speed    0 seconds
  Go To    ${BASE_URL}${path}

Close Browser Session
  Close All Browsers

Normalize Internal Url
  [Arguments]    ${href}
  ${trimmed}=    Strip String    ${href}
  IF    '${trimmed}' == ''
    RETURN    ${NONE}
  END
  IF    '${trimmed}'.startswith('#') or '${trimmed}'.startswith('mailto:') or '${trimmed}'.startswith('tel:') or '${trimmed}'.startswith('javascript:')
    RETURN    ${NONE}
  END
  ${is_internal}=    Evaluate    $trimmed.startswith('/') or $trimmed.startswith($BASE_URL)
  IF    not ${is_internal}
    RETURN    ${NONE}
  END
  ${path_only}=    Evaluate    sys.modules['urllib.parse'].urlsplit($trimmed).path or '/'    modules=sys, urllib.parse
  RETURN    ${path_only}

Collect Internal Links From Current Page
  ${hrefs}=    Get WebElements    css:a[href]
  ${internal_paths}=    Create List
  FOR    ${element}    IN    @{hrefs}
    ${href}=    Get Element Attribute    ${element}    href
    ${path}=    Normalize Internal Url    ${href}
    IF    $path is not None and $path not in $internal_paths
      Append To List    ${internal_paths}    ${path}
    END
  END
  RETURN    ${internal_paths}

Assert Current Page Is Not 404
  ${status_markers}=    Create List    404    page not found
  ${title}=    Get Title
  ${source}=    Get Source
  ${title_lower}=    Convert To Lower Case    ${title}
  ${source_lower}=    Convert To Lower Case    ${source}
  FOR    ${marker}    IN    @{status_markers}
    Should Not Contain    ${title_lower}    ${marker}
    Should Not Contain    ${source_lower}    ${marker}
  END

Assert Internal Destination Loads
  [Arguments]    ${path}
  Go To    ${BASE_URL}${path}
  Location Should Contain    ${BASE_URL}
  Run Keyword If    '${path}'.endswith('.pdf')    Title Should Not Be    404
  ...    ELSE    Assert Current Page Is Not 404
