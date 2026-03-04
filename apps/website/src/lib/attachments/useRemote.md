## How we want to use the useRemote.

I want for this to have some kind optional control, similar to the `enhance`
setup currently, but the process works very differently.

For starters, I think we only allow `command`s to be passed. Forms have their own weird little rules and it's sort of the reason for making this in the first place, since I can't seem to use the `form` stuff for uploading images correctly.

Overall things

1. Should handle refreshing of data; means that the function passed needs to be setup in a way that it updates any applicable `query` functions dependent on the data.
2. Help me jesus.

### Mode 1

The simplest mode; you want all of it to happen just as it should and you do not need any fine-grained control over anything.

```svelte
<form {@attach useRemote(addTodo)}>
  <!-- Form stuff -->
</form>
```

### Mode 2 (nope)

~~This mode gives a bit more control; allows the user to call custom refresh/invalidation logic.~~

Won't work due to the rpc wrappers being function calls. there's no way for us to determine if the function is an RPC or this setup.

```svelte
<form {
  @attach useRemote((data) => {
    addTodo(data);
    return async () => {
      getTodos().refresh();
      invalidate('user:todos');
    }
  })
}></form>
```
### Mode 3

With a bit more setup, we mimic something like TanStack Query

```svelte
<form {
  @attach useRemote({
    fn: addTodo,
    validator: (fd) => {
      return fd;
    }
    invalidator: async () => {
      getTodos().refresh();
      await invalidate('user:load')
    }
  })
}></form>
```