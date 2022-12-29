@site
Feature: reentrysf.org
  Background: Host header
    Given request header Host: ${TEST_SUBDOMAIN}reentrysf.org

  Scenario: /
    When I visit /
    Then I should be redirected to https://sf.gov/reentry-sf

  Scenario: /about
    When I visit /about
    Then I should be redirected to https://sf.gov/reentry-sf

  Scenario: archive.sf.gov links
    Given request header Host: ${TEST_SUBDOMAIN}archive.sf.gov
    When I visit /_/reentrysf.org
    Then I should be redirected to https://sf.gov/reentry-sf
