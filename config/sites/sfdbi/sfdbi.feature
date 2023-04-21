@site
Feature: sfdbi.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}sfdbi.org

  Scenario: /
    When I visit /
    Then I should be redirected to "https://sf.gov/departments/department-building-inspection"

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/20246/3/https://sfdbi.org/blah
