Run the test suite and report any failures.

If a specific file or component is mentioned in $ARGUMENTS, run only tests matching that pattern:
```
npm run test -- $ARGUMENTS
```

Otherwise run the full suite:
```
npm run test
```

Summarize: number of tests passed/failed, and for any failures show the test name and error message.
