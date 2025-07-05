# Generate 7730 Plugin

A basic Hardhat 3 plugin that adds a `generate-7730` task for demonstration purposes.

## Features

- Adds a new task called `generate-7730`
- Supports detailed output with the `--detail` flag
- Built for Hardhat 3 using the new plugin architecture

## Usage

Run the task with:

```bash
npx hardhat generate-7730
```

Run with detailed output:

```bash
npx hardhat generate-7730 --detail
```

## Plugin Structure

```
plugin/
├── index.ts              # Main plugin export
├── tasks/
│   └── generate-7730.ts  # Task definition
├── actions/
│   └── generate-7730.ts  # Task action logic
└── README.md            # This file
```

## Integration

The plugin is registered in `hardhat.config.ts`:

```typescript
import generate7730Plugin from "./plugin/index.js";

const config: HardhatUserConfig = {
  plugins: [generate7730Plugin],
  // ... other config
};
```

## Development

To extend this plugin:

1. Modify the action in `actions/generate-7730.ts`
2. Add additional flags or parameters in `tasks/generate-7730.ts`
3. Create additional tasks by adding them to the `tasks` array in `index.ts` 