@site
Feature: sf-hrc.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}sf-hrc.org

  Scenario: /
    When I visit /
    Then I should be redirected to https://sf.gov/departments/human-rights-commission

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/19238/3/https://sf-hrc.org/blah

  @prod-only
  Scenario: sf-hrc.org/
    Given request header Host: ${TEST_SUBDOMAIN}sf-hrc.org
    When I visit /
    Then I should be redirected to https://sf.gov/departments/human-rights-commission