@site
Feature: sfmayor.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}sfmayor.org

  Scenario: /
    When I visit /
    Then I should be redirected to https://sf.gov/departments/office-mayor

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/20094/3/https://sfmayor.org/blah
