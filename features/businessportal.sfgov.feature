@site
Feature: businessportal.sfgov.org
  Background: Host header
    Given request header Host: ${TEST_SUBDOMAIN}businessportal.sfgov.org

  Scenario: /
    When I visit /
    Then I should be redirected to https://sf.gov/departments/office-economic-and-workforce-development/office-small-business

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/org-571/3/https://businessportal.sfgov.org/blah

  Scenario: Resource links
    Given request header Host: ${TEST_SUBDOMAIN}businessportal.sf.gov
    When I visit /_/businessportal.sfgov.org/faq
    Then I should be redirected to https://sf.gov/departments/office-economic-and-workforce-development/office-small-business
    When I visit /_/businessportal.sfgov.org/faq/
    Then I should be redirected to https://sf.gov/departments/office-economic-and-workforce-development/office-small-business
