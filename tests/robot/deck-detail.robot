*** Settings ***
Documentation    Acceptance coverage for a deck detail page's controls: the
...              "Download PDF" link and the "View Deck" fullscreen presentation
...              trigger. Keyboard-driven advance/exit inside presentation mode
...              is covered separately (see the "presentation-mode" tag) and is
...              best-effort — see that test's own documentation for the tooling
...              caveat.
Resource         resources/site.resource
Suite Setup      Open Browser To Page    /slides/welcome
Suite Teardown   Close Browser Session
Test Setup       Given A Visitor Opens The Welcome Deck Detail Page

*** Test Cases ***
Deck Detail Page Offers A Working PDF Download
  [Documentation]    The "Download PDF" control must link to a real, non-empty
  ...    PDF document — not a 404 or an HTML error page silently served with a
  ...    200 status.
  ${pdf_url}=    Get Download PDF Link Url
  ${response}=    Fetch Url    ${pdf_url}
  Pdf Response Should Be Valid    ${response}

Deck Detail Page Offers A View Deck Control That Opens The Presentation
  [Documentation]    Clicking "View Deck" must open the fullscreen presentation
  ...    overlay showing the deck's first slide.
  [Teardown]    Close Presentation If Open
  When They Activate The View Deck Control
  Then The Presentation Overlay Should Be Open
  Then The Presentation Should Show A Slide

Presentation Mode Advances To The Next Slide And Exits On Escape
  [Documentation]    Best-effort keyboard-driven coverage of presentation mode,
  ...    driven through Selenium's synthetic key events rather than a real user
  ...    gesture.
  ...
  ...    Caveat: headless Chrome's implicit-fullscreen support is unreliable, so
  ...    the page script's own `overlay.requestFullscreen()` call may be
  ...    rejected here. The app already catches that rejection and keeps
  ...    presenting via a CSS class toggle rather than true OS-level fullscreen,
  ...    so this test verifies the overlay opens, the slide changes on
  ...    ArrowRight, and the overlay closes on Escape — it does not verify that
  ...    the browser actually enters real fullscreen. Real-browser, real-gesture
  ...    fullscreen keyboard behaviour (arrow keys advancing slides, Escape
  ...    exiting fullscreen) was already verified manually and is not
  ...    re-verified by this automated case.
  [Tags]    presentation-mode
  [Teardown]    Close Presentation If Open
  When They Activate The View Deck Control
  ${first_slide}=    Get Current Presentation Slide Markup
  When They Press The Right Arrow Key
  ${second_slide}=    Get Current Presentation Slide Markup
  Should Not Be Equal    ${first_slide}    ${second_slide}
  ...    Pressing the right arrow key did not change the displayed slide
  When They Press The Escape Key
  Then The Presentation Overlay Should Be Closed
