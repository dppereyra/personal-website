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
