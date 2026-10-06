*** Settings ***
Documentation    Acceptance coverage for the Contact page. It offers no form —
...              a public form invites bot spam — and instead leads with an
...              "Email Me" button that opens the visitor's own mail client
...              addressed to mail@dppereyra.com, with booking a meeting as the
...              secondary option.
Resource         resources/site.resource
Suite Setup      Open Browser To Page    /contact
Suite Teardown   Close Browser Session

*** Variables ***
${EMAIL_ME_LINK}    xpath://main//a[normalize-space()='Email Me']

*** Test Cases ***
The Contact Page Has No Form To Spam
  Given A Visitor Opens The Contact Page
  ${forms}=    Get Element Count    css:form
  Should Be Equal As Integers    ${forms}    0
  ...    The Contact page still renders ${forms} form(s)
  ${fields}=    Get Element Count    css:main input, main textarea
  Should Be Equal As Integers    ${fields}    0
  ...    The Contact page still renders ${fields} input field(s)

The Email Me Button Opens A Message To The Site Mailbox
  Given A Visitor Opens The Contact Page
  Element Should Be Visible    ${EMAIL_ME_LINK}
  ${href}=    Get Element Attribute    ${EMAIL_ME_LINK}    href
  Should Be Equal As Strings    ${href}    mailto:mail@dppereyra.com

The Email Me Button Carries A Mail Icon
  Given A Visitor Opens The Contact Page
  ${icons}=    Get Element Count    ${EMAIL_ME_LINK}//*[local-name()='svg']
  Should Be Equal As Integers    ${icons}    1
  ...    The Email Me button should show exactly one icon, found ${icons}

Email Me Is The Primary Action, Ahead Of Booking A Meeting
  Given A Visitor Opens The Contact Page
  ${email_first}=    Execute Javascript
  ...    const links=[...document.querySelectorAll('main a')]; const e=links.findIndex(a=>a.textContent.trim()==='Email Me'); const m=links.findIndex(a=>a.textContent.trim()==='Schedule a Meeting'); return e>=0 && m>=0 && e<m;
  Should Be True    ${email_first}
  ...    Email Me should come before Schedule a Meeting on the page
  ${class}=    Get Element Attribute    ${EMAIL_ME_LINK}    class
  Should Contain    ${class}    btn-primary
