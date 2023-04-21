@site
Feature: sfrb.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}sfrb.org

  Scenario: /
    When I visit /
    Then I should be redirected to "https://sf.gov/departments/rent-board"

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/20155/3/https://sfrb.org/blah
