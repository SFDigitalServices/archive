@site
Feature: sfelections.sfgov.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}sfelections.sfgov.org

  Scenario: /
    When I visit /
    Then I should be redirected to https://sf.gov/departments/department-elections

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/21144/3/https://sfelections.sfgov.org/blah
