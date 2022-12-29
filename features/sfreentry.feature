@site
Feature: sfreentry.org
  Background: Host header
    Given request header Host: ${TEST_SUBDOMAIN}sfreentry.org

  Scenario: /
    When I visit /
    Then I should be redirected to https://sf.gov/reentry-sf

  Scenario: /about
    When I visit /about
    Then I should be redirected to https://sf.gov/reentry-sf

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/20026/3/https://sfreentry.org/blah

  Scenario: archive.sf.gov links
    Given request header Host: ${TEST_SUBDOMAIN}archive.sf.gov
    When I visit /_/sfreentry.org
    Then I should be redirected to https://sf.gov/reentry-sf
