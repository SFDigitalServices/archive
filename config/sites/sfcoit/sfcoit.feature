@site
Feature: sfcoit.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}sfcoit.org

  Scenario: /
    When I visit /
    Then I should be redirected to "https://sf.gov/departments/committee-information-technology-coit"

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/19832/3/https://sfcoit.org/blah
