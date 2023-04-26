@site
Feature: sfcontroller.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}sfcontroller.org

  Scenario: /
    When I visit /
    Then I should be redirected to "https://sf.gov/departments/controllers-office"

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/19064/3/https://sfcontroller.org/blah
