import { GraphQLError } from 'graphql';
import { mapSchema, getDirective, MapperKind } from "@graphql-tools/utils";
import { defaultFieldResolver } from "graphql";

function isAuthorized(fieldPermissions: any, typePermissions: any, user: any) {
  const userPermissions = new Set(["self:anyone"]);

  // 1. Check if atleast one of the user's permissions matches that of required for accessing the field
  for (const permission of fieldPermissions) {
    if (userPermissions.has(permission)) {
      return true;
    }
  }

  // 2. if there are no field permissions then check if the type has permissions
  if (fieldPermissions.length === 0) {
    for (const typePermission of typePermissions) {
      if (userPermissions.has(typePermission)) {
        return true;
      }
    }
  }
  return false;
}

function gatherTypePermissions(schema: any) {
  // 1. Create a map to store a type and its permissions
  const typePermissionMapping = new Map();
  mapSchema(schema, {
    // 2. Executes once for each type definition in the schema
    [MapperKind.OBJECT_TYPE]: (typeConfig) => {
      const typeAuthDirective = getDirective(schema, typeConfig, "auth")?.[0];
      const typeLevelPermissions = typeAuthDirective?.permissions ?? [];
      // 3. Collect permissions for each type
      typePermissionMapping.set(typeConfig.name, typeLevelPermissions);
      return typeConfig;
    },
  });
  return typePermissionMapping;
}

function shouldDenyFieldByDefault(
  fieldPermissions: any,
  typePermissions: any,
  fieldName: any,
  typeName: any
) {
  if (fieldName.startsWith("_") || typeName.startsWith("_")) {
    // Apollo's internal fields / types start with _
    return false;
  }
  const hasNoPermissions =
    fieldPermissions.length === 0 && typePermissions.length === 0;
  return hasNoPermissions;
}

export function getAuthorizedSchema(schema: any) {
  const typePermissionMapping = gatherTypePermissions(schema);

  const authorizedSchema = mapSchema(schema, {
    // Executes once for each object field definition in the schema
    [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName, typeName) => {
      // 1. Try to get the @auth directive config on the field
      const fieldAuthDirective = getDirective(schema, fieldConfig, "auth")?.[0];
      // 1.1 Get the permissions for the field
      const fieldPermissions = fieldAuthDirective?.permissions ?? [];
      // 1.2 Get the permissions for the field's type
      const typePermissions = typePermissionMapping.get(typeName) ?? [];

      // 1.3 Check if field should be denied by default
      if (
        shouldDenyFieldByDefault(
          fieldPermissions,
          typePermissions,
          fieldName,
          typeName
        )
      ) {
        // Replace, the resolver with a ForbiddenError throwing function.
        // Optionally log here so it shows up while the server starts
        fieldConfig.resolve = () => {
          throw new GraphQLError(`No access control specified for ${typeName}.${fieldName}. Deny by default`, {
            extensions: {
              code: 'FORBIDDEN'
            },
          });
        };
        return fieldConfig;
      }

      // 2. If a @auth directive is found, replace the field's resolver with a custom resolver
      if (fieldPermissions.length > 0 || typePermissions.length > 0) {
        // 2.1. Get the original resolver on the field
        const originalResolver = fieldConfig.resolve ?? defaultFieldResolver;
        // 2.2. Replace the field's resolver with a custom resolver
        fieldConfig.resolve = (source, args, context, info) => {
          const user = context.user;
          if (!isAuthorized(fieldPermissions, typePermissions, user)) {
            // 2.3 If the user doesn't have the required permissions, throw an error
            throw new GraphQLError("Unauthorized", {
                extensions: {
                  code: 'FORBIDDEN'
//                  myExtension: "foo",
                },
              });
          }
          // 2.4 Otherwise call the original resolver and return the result
          return originalResolver(source, args, context, info);
        };
      }
      return fieldConfig;
    },
  });
  return authorizedSchema;
}