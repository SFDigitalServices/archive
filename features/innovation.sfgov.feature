@site
Feature: innovation.sfgov.org
  Background: Host header
    Given request header Host: ${TEST_SUBDOMAIN}innovation.sfgov.org

  Scenario: /
    When I visit /
    Then I should be redirected to https://sf.gov/departments/mayors-office-innovation

Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/19260/3/https://innovation.sfgov.org/blah