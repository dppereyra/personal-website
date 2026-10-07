*** Settings ***
Documentation    Acceptance coverage for the New Relic Browser agent. A build only
...              ships the agent when Netlify provides the Browser app's keys, so
...              local and CI builds must load none. Where it does load, it must
...              run only the chosen features and tag every event with the
...              environment and the release (commit).
...
...              Set NEW_RELIC_ENVIRONMENT to the tag the surface under test
...              should report (production, staging or preview); leave it empty
...              for builds without keys.
Resource         resources/site.resource
Suite Setup      Open Browser To Page    /
Suite Teardown   Close Browser Session
Test Teardown    Note Netlify Challenge If The Test Failed

*** Variables ***
${NEW_RELIC_ENVIRONMENT}    %{NEW_RELIC_ENVIRONMENT=}
@{NEW_RELIC_FEATURES}       ajax    jserrors    metrics    page_view_event    page_view_timing

*** Test Cases ***
A Build Without New Relic Keys Loads No Agent
  Skip If    $NEW_RELIC_ENVIRONMENT    This surface is expected to report to New Relic
  ${agent}=    Get New Relic Agent State
  Should Be Equal As Integers    ${agent}[count]    0
  ...    A build without New Relic keys still started ${agent}[count] agent(s)

The Agent Reports The Environment And Release
  Skip If    not $NEW_RELIC_ENVIRONMENT    No New Relic environment expected for this surface
  ${agent}=    Get New Relic Agent State
  Should Be Equal As Integers    ${agent}[count]    1
  Should Be Equal    ${agent}[environment]    ${NEW_RELIC_ENVIRONMENT}
  Should Not Be Empty    ${agent}[release]    The agent carries no release (application.version)

The Agent Runs Only The Chosen Features
  [Documentation]    Session replay, traces, user actions and logging stay off;
  ...    only page views, timings, errors, AJAX timings and metrics run.
  Skip If    not $NEW_RELIC_ENVIRONMENT    No New Relic environment expected for this surface
  ${agent}=    Get New Relic Agent State
  Lists Should Be Equal    ${agent}[features]    ${NEW_RELIC_FEATURES}
