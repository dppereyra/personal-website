*** Settings ***
Resource    resources/common.resource
Suite Setup    Open Browser To Page    /
Suite Teardown    Close Browser Session

*** Test Cases ***
All Internal Clickable Destinations Should Not 404
  ${queue}=    Create List    /
  ${visited}=    Create List
  WHILE    $queue
    ${path}=    Remove From List    ${queue}    0
    IF    $path in $visited
      CONTINUE
    END
    Append To List    ${visited}    ${path}
    Assert Internal Destination Loads    ${path}
    IF    not '${path}'.endswith('.pdf')
      ${links}=    Collect Internal Links From Current Page
      FOR    ${link}    IN    @{links}
        IF    $link not in $visited and $link not in $queue
          Append To List    ${queue}    ${link}
        END
      END
    END
  END
  List Should Contain Value    ${visited}    /about
  List Should Contain Value    ${visited}    /work
  List Should Contain Value    ${visited}    /slides
  List Should Contain Value    ${visited}    /contact
  List Should Contain Value    ${visited}    /resume.pdf
  List Should Contain Value    ${visited}    /slides/welcome.pdf
