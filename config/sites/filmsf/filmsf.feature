@site
Feature: filmsf.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}filmsf.org

  Scenario: /
    When I visit /
    Then I should be redirected to "https://sf.gov/departments/office-economic-and-workforce-development/film-sf"

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/20204/3/https://filmsf.org/blah
