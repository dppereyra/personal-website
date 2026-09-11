*** Settings ***
Documentation    Acceptance coverage for the `ai-assisted: true` front-matter
...              disclosure. A marked blog post shows a badge that stays fixed in
...              the top-right corner while the reader scrolls; a marked slide
...              deck shows the theme's footer on every slide. Unmarked content
...              must show neither, since the flag is opt-in.
Resource         resources/site.resource
Suite Setup      Open Browser To Page    /blog/marking-ai-assisted-content
Suite Teardown   Close Browser Session

*** Test Cases ***
A Marked Blog Post Discloses That It Is AI Assisted
  [Documentation]    The badge must render and say so in words, not just exist
  ...    as an empty element.
  Given A Visitor Opens The AI Assisted Post
  Then The AI Assisted Badge Should Be Visible

The Disclosure Badge Stays In The Corner While Reading
  [Documentation]    The point of the badge is that it remains visible from
  ...    anywhere in the post rather than scrolling away with the header, so its
  ...    position is asserted relative to the viewport after scrolling to the
  ...    bottom. The scroll itself is verified first, so a post too short to
  ...    scroll cannot make this pass for the wrong reason.
  Given A Visitor Opens The AI Assisted Post
  ${before}=    Get Badge Viewport Position
  When They Scroll To The Bottom Of The Post
  Then The Page Should Have Actually Scrolled
  ${after}=    Get Badge Viewport Position
  Should Be Equal    ${before}    ${after}
  ...    The badge moved with the page instead of staying fixed to the viewport
  Then The Badge Should Sit In The Top Right Of The Viewport

An Unmarked Blog Post Shows No Disclosure
  [Documentation]    The flag defaults to false, so untagged posts must be left
  ...    exactly as they were.
  Given A Visitor Opens An Unmarked Post
  Then The AI Assisted Badge Should Not Exist

A Marked Deck Shows The Disclosure Footer On Every Slide
  [Documentation]    The footer is drawn by the Marp theme off the .ai-assisted
  ...    class, which the renderer puts on every section — a reader landing on
  ...    any single slide should see the disclosure.
  Given A Visitor Opens The AI Assisted Deck
  ${slides}=    Count Slides In Deck
  ${marked}=    Count Slides Showing The AI Assisted Footer
  Should Be True    ${slides} > 0    The deck rendered no slides at all
  Should Be Equal As Integers    ${marked}    ${slides}
  ...    Only ${marked} of ${slides} slides carried the AI-assisted disclosure

An Unmarked Deck Shows No Disclosure Footer
  Go To    ${BASE_URL}/slides/welcome
  Wait Until Page Contains Element    id:marp-deck    timeout=10 seconds
  ${marked}=    Count Slides Showing The AI Assisted Footer
  Should Be Equal As Integers    ${marked}    0
  ...    An unmarked deck rendered the AI-assisted disclosure on ${marked} slide(s)
  ${style}=    Get Deck Disclosure Computed Style
  Should Be Equal    ${style}[content]    none
  ...    An unmarked deck still drew a ::before footer: ${style}[content]

A Marked Deck Actually Draws The Footer, Not Just The Class
  [Documentation]    The class landing on every section proves the renderer did
  ...    its job; it says nothing about whether the theme draws anything. This
  ...    asserts the rendered text, so deleting the wave.css rule fails here
  ...    rather than shipping an invisible disclosure.
  Given A Visitor Opens The AI Assisted Deck
  ${style}=    Get Deck Disclosure Computed Style
  Should Contain    ${style}[content]    AI-assisted
  ...    The theme drew no disclosure footer (::before content was ${style}[content])

The Disclosure Footer Clears The Page Number
  [Documentation]    Regression guard for a real collision: the page number
  ...    resolves to the same bottom-right slot, so a footer sharing that line
  ...    overlaps it. Compares the two computed boxes rather than eyeballing a
  ...    screenshot.
  Given A Visitor Opens The AI Assisted Deck
  ${style}=    Get Deck Disclosure Computed Style
  Should Not Be Equal    ${style}[pagContent]    none
  ...    No page number rendered, so this test cannot prove the footer clears it
  Should Be True    ${style}[discBottom] >= ${style}[pagTop]
  ...    Disclosure footer overlaps the page number: footer starts ${style}[discBottom]px from the bottom but the page number reaches ${style}[pagTop]px

The Disclosure Badge Stops Floating On Narrow Screens
  [Documentation]    A fixed badge would sit on top of the article text on a
  ...    phone, so below 640px it returns to normal page flow.
  [Teardown]    Restore Desktop Viewport
  Given A Visitor Opens The AI Assisted Post
  ${desktop}=    Get Badge Computed Style
  Should Be Equal    ${desktop}[position]    fixed
  ...    Badge was not floating at desktop width (${desktop}[width]px)
  When The Viewport Is Phone Sized
  ${phone}=    Get Badge Computed Style
  Should Be Equal    ${phone}[position]    static
  ...    Badge still floats at ${phone}[width]px, where it would cover the article

The Disclosure Badge Never Covers The Navbar
  [Documentation]    The badge is fixed near the top of the viewport, where the
  ...    sticky navbar also lives, so its stacking order has to stay underneath.
  Given A Visitor Opens The AI Assisted Post
  ${style}=    Get Badge Computed Style
  ${badge_z}=    Convert To Integer    ${style}[zIndex]
  ${nav_z}=    Convert To Integer    ${style}[navZIndex]
  Should Be True    ${badge_z} < ${nav_z}
  ...    Badge z-index ${badge_z} is not below the navbar's ${nav_z}
