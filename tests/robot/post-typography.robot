*** Settings ***
Documentation    Acceptance coverage for blog post body typography. Post bodies
...              sit in a `prose` container, which only does anything when the
...              Tailwind typography plugin is loaded — without it, headings,
...              paragraphs and lists collapse into unstyled running text. These
...              checks assert computed styles rather than class names, so a
...              missing plugin fails here even though the markup is unchanged.
Resource         resources/site.resource
Suite Setup      Open Browser To Page    /blog/marking-ai-assisted-content
Suite Teardown   Close Browser Session
Test Teardown    Note Netlify Challenge If The Test Failed

*** Test Cases ***
Post Headings Stand Out From Body Text
  [Documentation]    A section heading must be visibly larger and heavier than
  ...    the paragraphs around it.
  Given A Visitor Opens The AI Assisted Post
  ${styles}=    Get Post Body Typography
  Should Be True    ${styles}[h2_size] >= ${styles}[p_size] * 1.2
  ...    Post h2 (${styles}[h2_size]px) is not meaningfully larger than body text (${styles}[p_size]px)
  Should Be True    ${styles}[h2_weight] >= 600
  ...    Post h2 font-weight is ${styles}[h2_weight], so it reads as body text

Post Paragraphs And Lists Are Spaced And Marked
  [Documentation]    Paragraphs need vertical rhythm and lists need markers, or
  ...    the body reads as one block.
  Given A Visitor Opens The AI Assisted Post
  ${styles}=    Get Post Body Typography
  Should Be True    ${styles}[p_margin] > 0
  ...    Post paragraphs have no vertical margin
  Should Not Be Equal    ${styles}[list_style]    none
  ...    Post lists render without markers

Post Body Text Stays Readable In The Dark Theme
  [Documentation]    The typography plugin colours text on its own palette; on
  ...    the dark daisyUI theme that must still contrast with the page, rather
  ...    than leaving dark grey text on a dark background (WCAG AA, 4.5:1).
  Given A Visitor Opens The AI Assisted Post
  Switch To Theme    fuwari-dark
  ${ratio}=    Get Post Body Contrast Ratio
  Should Be True    ${ratio} >= 4.5
  ...    Post body text contrast in the dark theme is ${ratio}:1
  Switch To Theme    fuwari
  ${ratio}=    Get Post Body Contrast Ratio
  Should Be True    ${ratio} >= 4.5
  ...    Post body text contrast in the light theme is ${ratio}:1

Each Post Has A Single Top-Level Heading
  [Documentation]    The layout renders the front-matter title as the page's h1,
  ...    so a post body must not open with its own `# Title` — that shows the
  ...    title twice and gives the page two top-level headings.
  FOR    ${slug}    IN    marking-ai-assisted-content    the-bootstrap-that-hung-for-six-hours    welcome
    Go To    ${BASE_URL}/blog/${slug}
    Wait Until Page Contains Element    css:article    timeout=10 seconds
    ${count}=    Get Element Count    css:h1
    Should Be Equal As Integers    ${count}    1
    ...    /blog/${slug} renders ${count} h1 elements
  END
