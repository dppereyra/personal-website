*** Settings ***
Library    Collections
Library    SeleniumLibrary    timeout=10 seconds    run_on_failure=Capture Page Screenshot
Library    String

*** Variables ***
${BASE_URL}             %{BASE_URL=http://127.0.0.1:4321}
# True only when testing the real public site; mirrors src/utils/site-context.ts.
${IS_PRODUCTION_SITE}   ${{ '${BASE_URL}'.split('/')[2] in ('dppereyra.com', 'www.dppereyra.com') }}
${BROWSER}              %{BROWSER=chrome}
${HEADLESS_ARG}         --headless=new
${CHROME_BINARY}        %{CHROME_BINARY=}
${FIREFOX_BINARY}       %{FIREFOX_BINARY=}

*** Keywords ***
Open Browser To Page
  [Arguments]    ${path}=/
  ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions() if $BROWSER == 'chrome' else sys.modules['selenium.webdriver'].FirefoxOptions()    modules=sys, selenium.webdriver
  IF    '${BROWSER}' == 'chrome'
    Call Method    ${options}    add_argument    ${HEADLESS_ARG}
    Call Method    ${options}    add_argument    --no-sandbox
    Call Method    ${options}    add_argument    --disable-dev-shm-usage
    IF    '${CHROME_BINARY}' != ''
      Evaluate    setattr($options, 'binary_location', r'''${CHROME_BINARY}''')
    END
    Create Webdriver    Chrome    options=${options}
    Block Netlify Review Toolbar
  ELSE
    Call Method    ${options}    add_argument    --headless
    IF    '${FIREFOX_BINARY}' != ''
      Evaluate    setattr($options, 'binary_location', r'''${FIREFOX_BINARY}''')
    END
    Create Webdriver    Firefox    options=${options}
  END
  Set Selenium Speed    0 seconds
  Go To    ${BASE_URL}${path}

Block Netlify Review Toolbar
  [Documentation]    Netlify injects its review toolbar (the Drawer, loaded from
  ...    /.netlify/scripts/cdp) into deploy previews only. Pinned over the page
  ...    in the headless window, it intercepts clicks the tests make, so the
  ...    script is blocked to make previews behave like staging and production.
  ...    Reviewers browsing a preview still get the toolbar.
  ${sl}=    Get Library Instance    SeleniumLibrary
  Call Method    ${sl.driver}    execute_cdp_cmd    Network.enable    ${{ {} }}
  Call Method    ${sl.driver}    execute_cdp_cmd    Network.setBlockedURLs    ${{ {'urls': ['*/.netlify/scripts/cdp*']} }}

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

Assert PDF Destination Is Not 404
  ${title}=    Get Title
  Should Not Be Equal As Strings    ${title}    404

Assert Internal Destination Loads
  [Arguments]    ${path}
  Go To    ${BASE_URL}${path}
  Location Should Contain    ${BASE_URL}
  Run Keyword If    '${path}'.endswith('.pdf')    Assert PDF Destination Is Not 404
  ...    ELSE    Assert Current Page Is Not 404
