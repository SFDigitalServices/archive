# Tests

This is a suite of acceptance tests for the archive service. They're written in [Gherkin] and run with [cucumber-js].

Feature files (`features/**/*.feature`) are the primary unit of testing, and are set up with step definitions (the `Given`, `When`, and `Then` expressions) for general-purpose HTTP response testing.

There should be one `.feature` file per archived site, and one or more for the `archive.sf.gov` static site. Archived site tests with redirects should look something like this:

```feature
Feature: feature name
Scenarios:
  Background: common setup steps
    Given request headers:
      | Host | whatever-sfgov.org |

  Scenario: /
    When I visit /
    Then I should be redirected to https://sf.gov/departments/whatever

  Scenario: /other
    When I visit /other
    Then I should be redirected to https://web.archive-it.org/...
```

Step definitions live in [features/steps.js](./features/steps.js). See the [cucumber-js API docs](https://github.com/cucumber/cucumber-js/blob/main/docs/support_files/api_reference.md#api-reference) for more info.

[gherkin]: https://cucumber.io/docs/gherkin/reference/
[cucumber-js]: https://github.com/cucumber/cucumber-js