export function isValidSaleCompany(companySistema: string) {
    if (!companySistema || typeof companySistema !== "string") {
        return false; // Protege contra números, objetos, null o undefined
    }
    return companySistema.trim().toUpperCase() !== "";
}
