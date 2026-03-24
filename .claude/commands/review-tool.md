Review an AI tool implementation for correctness and edge cases.

If $ARGUMENTS specifies a tool name (str-replace or file-manager), read the corresponding file:
- `src/lib/tools/str-replace.ts` for str_replace_editor
- `src/lib/tools/file-manager.ts` for file_manager

Also read `src/app/api/chat/route.ts` to understand how the tool is registered and invoked.

Check for:
1. All operations are handled (create, str_replace, insert, view for str-replace; rename, delete for file-manager)
2. Error cases return useful messages rather than throwing
3. Tool schema matches what the API route registers
4. Any operation that mutates the VirtualFileSystem is applied correctly
