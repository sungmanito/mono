import { getContext } from 'telefunc';

export { onStream };

async function onStream() {
  const ctx = getContext();
  console.info('onStreamContext', ctx);
  return {
    test: true,
  };
}
