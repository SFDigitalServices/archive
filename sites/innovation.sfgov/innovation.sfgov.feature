@site
Feature: sftreasureisland.org
  Background: Host header
    Given request headers:
      | Host | innovation.sfgov.org |
  Scenario: /
    When I visit /
    Then I should be redirected to https://sf.gov/departments/mayors-office-innovation
