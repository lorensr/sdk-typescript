import {
  DataConverter,
  defaultPayloadCodec,
  defaultPayloadConverter,
  errorCode,
  hasOwnProperty,
  LoadedDataConverter,
  PayloadConverter,
  ValueError,
} from '@temporalio/workflow-common';

const isValidPayloadConverter = (PayloadConverter: unknown): PayloadConverter is PayloadConverter =>
  typeof PayloadConverter === 'object' &&
  PayloadConverter !== null &&
  ['toPayload', 'fromPayload'].every(
    (method) => typeof (PayloadConverter as Record<string, unknown>)[method] === 'function'
  );

function requirePayloadConverter(path: string): PayloadConverter {
  let module;
  try {
    module = require(path); // eslint-disable-line @typescript-eslint/no-var-requires
  } catch (error) {
    if (errorCode(error) === 'MODULE_NOT_FOUND') {
      throw new ValueError(`Could not find a file at the specified payloadConverterPath: '${path}'.`);
    }
    throw error;
  }

  if (hasOwnProperty(module, 'payloadConverter')) {
    if (isValidPayloadConverter(module.payloadConverter)) {
      return module.payloadConverter;
    } else {
      throw new ValueError(
        `payloadConverter export at ${path} must be an object with toPayload and fromPayload methods`
      );
    }
  } else {
    throw new ValueError(`Module ${path} does not have a \`payloadConverter\` named export`);
  }
}

export function loadDataConverter(dataConverter?: DataConverter): LoadedDataConverter {
  let payloadConverter: PayloadConverter = defaultPayloadConverter;
  if (dataConverter?.payloadConverterPath) {
    payloadConverter = requirePayloadConverter(dataConverter.payloadConverterPath);
  }
  return {
    payloadConverter,
    payloadCodec: dataConverter?.payloadCodec ?? defaultPayloadCodec,
  };
}