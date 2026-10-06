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

Get Response Header
  [Documentation]    Returns the value of ${header_name} from a urllib response's
  ...    headers (HTTP header lookup is case-insensitive), or an empty string if
  ...    the header is absent from the response.
  [Arguments]    ${response}    ${header_name}
  ${value}=    Evaluate    $response.headers.get('''${header_name}''', '')
  RETURN    ${value}

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

# --- Baseline security response headers -----------------------------------

Response For A Requested Path Should Include Baseline Security Headers
  [Documentation]    Fetches ${path} from ${BASE_URL} (independent of any
  ...    browser session, like the deck detail PDF check) and asserts the
  ...    response carries every baseline security header this site is
  ...    expected to set on ${description}.
  [Arguments]    ${path}    ${description}
  ${response}=    Fetch Url    ${BASE_URL}${path}
  Response Should Set X-Content-Type-Options To Nosniff    ${response}    ${description}
  Response Should Set A Safe X-Frame-Options    ${response}    ${description}
  Response Should Set A Sane Referrer-Policy    ${response}    ${description}
  Response Should Set A Non-Trivial Content-Security-Policy    ${response}    ${description}

Response Should Set X-Content-Type-Options To Nosniff
  [Documentation]    Asserts the response's X-Content-Type-Options header is
  ...    present and set to "nosniff" (case-insensitive). This stops browsers
  ...    from MIME-sniffing a response away from its declared Content-Type,
  ...    which is how a misdeclared upload can end up executed as script.
  [Arguments]    ${response}    ${description}
  ${value}=    Get Response Header    ${response}    X-Content-Type-Options
  ${value_lower}=    Convert To Lower Case    ${value}
  Should Be Equal As Strings    ${value_lower}    nosniff
  ...    X-Content-Type-Options header missing or not "nosniff" on ${description} (got: "${value}")

Response Should Set A Safe X-Frame-Options
  [Documentation]    Asserts X-Frame-Options is present and set to DENY or
  ...    SAMEORIGIN (case-insensitive), which stops the page being framed by
  ...    an untrusted site (clickjacking).
  [Arguments]    ${response}    ${description}
  ${value}=    Get Response Header    ${response}    X-Frame-Options
  ${value_upper}=    Convert To Upper Case    ${value}
  ${allowed}=    Create List    DENY    SAMEORIGIN
  List Should Contain Value    ${allowed}    ${value_upper}
  ...    X-Frame-Options header missing or not DENY/SAMEORIGIN on ${description} (got: "${value}")

Response Should Set A Sane Referrer-Policy
  [Documentation]    Asserts Referrer-Policy is present and set to one of the
  ...    spec-defined values that actually limit cross-origin referrer leakage
  ...    (e.g. "strict-origin-when-cross-origin"). Rejects a missing header
  ...    and rejects the permissive "unsafe-url" value, which leaks the full
  ...    URL cross-origin and so is not a "sane" baseline choice.
  [Arguments]    ${response}    ${description}
  ${value}=    Get Response Header    ${response}    Referrer-Policy
  ${value_lower}=    Convert To Lower Case    ${value}
  ${allowed}=    Create List
  ...    no-referrer    no-referrer-when-downgrade    origin
  ...    origin-when-cross-origin    same-origin    strict-origin
  ...    strict-origin-when-cross-origin
  List Should Contain Value    ${allowed}    ${value_lower}
  ...    Referrer-Policy header missing or not a sane value on ${description} (got: "${value}")

Response Should Set A Non-Trivial Content-Security-Policy
  [Documentation]    Asserts Content-Security-Policy is present and non-empty.
  ...    Deliberately does not assert on specific directives — the CSP's exact
  ...    design is owned elsewhere — this only guards against the header being
  ...    absent or a trivial placeholder value.
  [Arguments]    ${response}    ${description}
  ${value}=    Get Response Header    ${response}    Content-Security-Policy
  ${trimmed}=    Strip String    ${value}
  Should Not Be Empty    ${trimmed}
  ...    Content-Security-Policy header is missing or empty on ${description}
  ${length}=    Get Length    ${trimmed}
  Should Be True    ${length} >= 15
  ...    Content-Security-Policy header looks like a placeholder rather than a real policy on ${description} (got: "${value}")

# --- AI-assisted disclosure ----------------------------------------------

Given A Visitor Opens The AI Assisted Post
  [Documentation]    Opens the blog post that sets `ai-assisted: true` in its
  ...    front matter.
  Go To    ${BASE_URL}/blog/marking-ai-assisted-content
  Wait Until Page Contains Element    css:article    timeout=10 seconds

Given A Visitor Opens An Unmarked Post
  [Documentation]    Opens a blog post that does not set `ai-assisted`, to prove
  ...    the badge is opt-in rather than always-on.
  Go To    ${BASE_URL}/blog/welcome
  Wait Until Page Contains Element    css:article    timeout=10 seconds

Given A Visitor Opens The AI Assisted Deck
  Go To    ${BASE_URL}/slides/marking-ai-assisted-content
  Wait Until Page Contains Element    id:marp-deck    timeout=10 seconds

Then The AI Assisted Badge Should Be Visible
  Wait Until Element Is Visible    css:.ai-assisted-badge    timeout=10 seconds
  ${text}=    Get Text    css:.ai-assisted-badge
  Should Contain    ${text}    AI-assisted
  ...    The disclosure badge rendered but did not say it was AI-assisted

Then The AI Assisted Badge Should Not Exist
  Page Should Not Contain Element    css:.ai-assisted-badge

Get Badge Viewport Position
  [Documentation]    Returns the badge's position relative to the viewport (not
  ...    the document), which is what decides whether a fixed element has stayed
  ...    put while the page scrolled underneath it.
  ${rect}=    Execute Javascript
  ...    const r = document.querySelector('.ai-assisted-badge').getBoundingClientRect(); return [Math.round(r.top), Math.round(r.right)];
  RETURN    ${rect}

When They Scroll To The Bottom Of The Post
  Execute Javascript    window.scrollTo(0, document.body.scrollHeight);
  Sleep    0.4s

Then The Page Should Have Actually Scrolled
  [Documentation]    Guards the scroll test: if the post were too short to
  ...    scroll, the "badge stayed put" assertion would pass trivially.
  ${offset}=    Execute Javascript    return Math.round(window.scrollY);
  Should Be True    ${offset} > 0
  ...    The page did not scroll, so the fixed-position assertion proves nothing

Then The Badge Should Sit In The Top Right Of The Viewport
  ${rect}=    Get Badge Viewport Position
  ${viewport_width}=    Execute Javascript    return Math.round(window.innerWidth);
  Should Be True    ${rect}[0] >= 0 and ${rect}[0] < 200
  ...    Badge is not near the top of the viewport (top=${rect}[0])
  Should Be True    ${rect}[1] > ${viewport_width} / 2
  ...    Badge is not in the right half of the viewport (right=${rect}[1])

Count Slides Showing The AI Assisted Footer
  [Documentation]    Counts rendered slides carrying the theme's .ai-assisted
  ...    class, which is what draws the bottom-right disclosure footer.
  ${count}=    Get Element Count    css:#marp-deck section.ai-assisted
  RETURN    ${count}

Count Slides In Deck
  ${count}=    Get Element Count    css:#marp-deck section
  RETURN    ${count}

Get Deck Disclosure Computed Style
  [Documentation]    Returns the computed ::before box the theme actually draws
  ...    on the first slide, alongside the ::after page-number box. Asserting on
  ...    computed style rather than the presence of the .ai-assisted class is
  ...    what catches the theme rule being removed or repositioned — the class
  ...    can be perfectly correct while nothing is visible.
  ${data}=    Execute Javascript
  ...    const s=document.querySelector('#marp-deck section'); const b=getComputedStyle(s,'::before'); const a=getComputedStyle(s,'::after'); const px=v=>parseFloat(v)||0; const bl=px(b.lineHeight)||px(b.fontSize)*1.5; const al=px(a.lineHeight)||px(a.fontSize)*1.5; return {content:b.content, discBottom:px(b.bottom), discTop:px(b.bottom)+bl, pagContent:a.content, pagBottom:px(a.bottom), pagTop:px(a.bottom)+al};
  RETURN    ${data}

Get Badge Computed Style
  ${data}=    Execute Javascript
  ...    const e=document.querySelector('.ai-assisted-badge'); const n=document.querySelector('nav.site-navbar'); const c=getComputedStyle(e); return {position:c.position, zIndex:c.zIndex, navZIndex:getComputedStyle(n).zIndex, width:Math.round(window.innerWidth)};
  RETURN    ${data}

When The Viewport Is Phone Sized
  [Documentation]    640px is the breakpoint below which the badge stops
  ...    floating; 400px is a realistic phone width well inside it.
  Set Window Size    400    900
  Sleep    0.4s

Restore Desktop Viewport
  Set Window Size    1280    900
  Sleep    0.4s

# --- HTTP helpers ------------------------------------------------------------

Read Response Text
  [Documentation]    Returns a urllib response's body decoded as UTF-8.
  [Arguments]    ${response}
  ${body}=    Call Method    ${response}    read
  ${text}=    Evaluate    $body.decode('utf-8')
  RETURN    ${text}

Get Url Status
  [Documentation]    Returns the HTTP status code for ${url}, including error
  ...    statuses that urllib raises as exceptions rather than returning.
  [Arguments]    ${url}
  TRY
    ${response}=    Fetch Url    ${url}
    ${status}=    Call Method    ${response}    getcode
  EXCEPT    *HTTP Error *    type=GLOB    AS    ${error}
    ${status}=    Evaluate    int(re.search(r'HTTP Error (\\d+)', $error).group(1))    modules=re
  END
  RETURN    ${status}

# --- Post body typography ------------------------------------------------------

Get Post Body Typography
  [Documentation]    Returns the computed size and weight of the first post-body
  ...    h2, the size and vertical margin of the first post-body paragraph, and
  ...    the marker style of the first post-body list.
  ${data}=    Execute Javascript
  ...    const b=document.querySelector('article .prose'); const h=getComputedStyle(b.querySelector('h2')); const p=getComputedStyle(b.querySelector('p')); const l=b.querySelector('ul, ol'); return {h2_size:parseFloat(h.fontSize), h2_weight:parseInt(h.fontWeight,10), p_size:parseFloat(p.fontSize), p_margin:parseFloat(p.marginTop)+parseFloat(p.marginBottom), list_style:l?getComputedStyle(l).listStyleType:'missing'};
  RETURN    ${data}

Switch To Theme
  [Documentation]    Applies a daisyUI theme the same way the theme toggle does,
  ...    then waits out the 0.2s colour transition so computed colours are the
  ...    theme's final values rather than a mid-fade blend.
  [Arguments]    ${theme}
  Execute Javascript    document.documentElement.setAttribute('data-theme', '${theme}');
  Sleep    0.5s

Get Post Body Contrast Ratio
  [Documentation]    Returns the WCAG contrast ratio between the first post-body
  ...    paragraph's text colour and the nearest opaque background behind it.
  ${ratio}=    Execute Javascript
  ...    const p=document.querySelector('article .prose p'); const probe=document.createElement('canvas').getContext('2d'); const rgb=c=>{probe.clearRect(0,0,1,1);probe.fillStyle='rgba(0,0,0,0)';probe.fillStyle=c;probe.fillRect(0,0,1,1);const d=probe.getImageData(0,0,1,1).data;return [d[0],d[1],d[2],d[3]];}; let e=p, bg=null; while(e){const c=getComputedStyle(e).backgroundColor; const v=rgb(c); if(v[3]===255){bg=v;break;} e=e.parentElement;} bg=bg||[255,255,255]; const fg=rgb(getComputedStyle(p).color); const lum=v=>{const s=v.slice(0,3).map(x=>{x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);});return 0.2126*s[0]+0.7152*s[1]+0.0722*s[2];}; const a=lum(fg), b=lum(bg); return Math.round(((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05))*100)/100;
  RETURN    ${ratio}
