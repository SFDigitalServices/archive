Feature: archive.sf.gov
  Scenario: / redirect
    When I visit /
    Then I should be redirected to https://sf.gov/

  Scenario: *.herokuapp.com
    Given request headers:
      | Host | sfgov-archive.herokuapp.com |
    When I visit /
    Then I should be redirected to https://sf.gov/