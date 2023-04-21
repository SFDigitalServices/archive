@site
Feature: oewd.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}oewd.org

  Scenario: /
    When I visit /
    Then I should be redirected to "https://sf.gov/departments/office-economic-and-workforce-development"

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/19795/3/https://oewd.org/blah
