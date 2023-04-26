@site
Feature: sflawlibrary.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}sflawlibrary.org

  Scenario: /
    When I visit /
    Then I should be redirected to "https://sf.gov/departments/san-francisco-law-library"

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/20241/3/https://sflawlibrary.org/blah
