@site
Feature: {{ domain }}
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}{{ domain }}

  Scenario: /
    When I visit /
    Then I should be redirected to "{{ url }}"

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/{{ collection_id }}/3/https://{{ domain }}/blah
