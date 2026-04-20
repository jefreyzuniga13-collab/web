export interface TarjetaModelInterface {
    idTarjeta?: number | null;
    numero: string | null;
    cVV2: string | null;
    fechaVencimiento: string | null;
    idUsuario: number;
    porDefecto: boolean;
    titular: string | null;
    correo: string | null;
    telefono: string | null;
    panToken: string | null;
    spiToken: string | null;
    marca: string | null;
    ultimos4: string | null;
}