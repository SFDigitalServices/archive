@site
Feature: businessportal.sfgov.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}businessportal.sfgov.org

  Scenario: /
    When I visit /
    Then I should be redirected to https://sf.gov/departments/office-economic-and-workforce-development/office-small-business	

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/19187/3/https://businessportal.sfgov.org/blah
