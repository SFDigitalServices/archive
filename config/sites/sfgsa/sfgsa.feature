@site
Feature: sfgsa.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}sfgsa.org

  Scenario: /
    When I visit /
    Then I should be redirected to "https://sf.gov/departments/city-administrator"

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/19767/3/https://sfgsa.org/blah
