define([
        '../Core/defined',
        '../Core/RuntimeError',
        './createTaskProcessorWorker'
    ], function(
        defined,
        RuntimeError,
        createTaskProcessorWorker) {
    'use strict';

    var draco;
    var dracoDecoder;

    function getAttributeTypeFromSemantic(draco, semantic) {
        switch (semantic) {
            case 'POSITION':
                return draco.POSITION;
            case 'NORMAL':
                return draco.NORMAL;
            case 'RGB':
            case 'RGBA':
                return draco.COLOR;
            case 'BATCH_ID':
                return draco.GENERIC;
        }
    }

    function decodeDracoPointCloud(parameters) {
        var transform;
        var attributeData;
        var vertexArray;

        var dequantizeInShader = parameters.dequantizeInShader;

        var results = {};

        if (!defined(dracoDecoder)) {
            draco = self.wasmModule;
            dracoDecoder = new draco.Decoder();
        }

        if (dequantizeInShader) {
            dracoDecoder.SkipAttributeTransform(draco.POSITION);
            dracoDecoder.SkipAttributeTransform(draco.NORMAL);
        }

        var buffer = new draco.DecoderBuffer();
        buffer.Init(parameters.buffer, parameters.buffer.length);

        var geometryType = dracoDecoder.GetEncodedGeometryType(buffer);
        if (geometryType !== draco.POINT_CLOUD) {
            throw new RuntimeError('Draco geometry type must be POINT_CLOUD.');
        }

        var dracoPointCloud = new draco.PointCloud();
        var decodingStatus = dracoDecoder.DecodeBufferToPointCloud(buffer, dracoPointCloud);
        if (!decodingStatus.ok() || dracoPointCloud.ptr === 0) {
            throw new RuntimeError('Error decoding draco point cloud: ' + decodingStatus.error_msg());
        }

        draco.destroy(buffer);

        var numPoints = dracoPointCloud.num_points();

        var semantics = parameters.semantics;
        var length = semantics.length;
        for (var i = 0; i < length; ++i) {
            var semantic = semantics[i];
            var attributeType = getAttributeTypeFromSemantic(draco, semantic);
            if (!defined(attributeType)) {
                throw new RuntimeError('Error decoding draco point cloud: ' + semantic + ' is not a valid draco semantic');
            }
            var attributeId = dracoDecoder.GetAttributeId(dracoPointCloud, attributeType);
            var attribute = dracoDecoder.GetAttribute(dracoPointCloud, attributeId);
            var quantize = dequantizeInShader && (semantic === 'POSITION');
            var octEncode = dequantizeInShader && (semantic === 'NORMAL');
            var numComponents = attribute.num_components(); // TODO check that this is 2 for normals
            var quantization;

            if (quantize) {
                // TODO : why is transform.InitFromAttribute failing?
                transform = new draco.AttributeQuantizationTransform();
                transform.InitFromAttribute(attribute);
                var minValues = new Array(numComponents);
                for (i = 0; i < numComponents; ++i) {
                    minValues[i] = transform.min_value(i);
                }
                quantization = {
                    quantizationBits : transform.quantization_bits(),
                    minValues : minValues,
                    range : transform.range()
                };
                draco.destroy(transform);
            } else if (octEncode) {
                // TODO : check that num_components is actually 2 and stuff here
                transform = new draco.AttributeOctahedronTransform();
                if (transform.InitFromAttribute(attribute)) {
                    quantization = {
                        quantizationBits : transform.quantization_bits()
                    };
                }
                draco.destroy(transform);
            }

            var vertexArrayLength = numPoints * numComponents;

            if (quantize) {
                attributeData = new draco.DracoInt32Array();
                vertexArray = new Uint16Array(vertexArrayLength);
                dracoDecoder.GetAttributeInt32ForAllPoints(dracoPointCloud, attribute, attributeData);
            } else if (octEncode) {
                attributeData = new draco.DracoInt32Array();
                vertexArray = new Int16Array(vertexArrayLength);
                dracoDecoder.GetAttributeInt32ForAllPoints(dracoPointCloud, attribute, attributeData);
            } else if (attribute.data_type() === 4) {
                attributeData = new draco.DracoInt32Array();
                // Uint16Array is used because there is not currently a way to retrieve the maximum
                // value up front via the draco decoder API.  Max values over 65535 require a Uint32Array.
                vertexArray = new Uint16Array(vertexArrayLength);
                dracoDecoder.GetAttributeInt32ForAllPoints(dracoPointCloud, attribute, attributeData);
            } else {
                attributeData = new draco.DracoFloat32Array();
                vertexArray = new Float32Array(vertexArrayLength);
                dracoDecoder.GetAttributeFloatForAllPoints(dracoPointCloud, attribute, attributeData);
            }

            for (var j = 0; j < vertexArrayLength; ++j) {
                vertexArray[j] = attributeData.GetValue(j);
            }

            draco.destroy(attributeData);

            results[semantic] = {
                buffer : vertexArray,
                quantization : quantization
            };
        }

        draco.destroy(dracoPointCloud);
        return results;
    }

    return createTaskProcessorWorker(decodeDracoPointCloud);
});
