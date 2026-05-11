USE [PCGCOMPANIES]
GO
/****** Object:  StoredProcedure [dbo].[sp_Powertranz_LogInit]    Script Date: 4/22/2026 7:17:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER   PROCEDURE [dbo].[sp_Powertranz_LogInit]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = 'NIO',
    @RequestJson NVARCHAR(MAX) = NULL,
    @ResponseJson NVARCHAR(MAX) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @SpiToken NVARCHAR(250) = NULL,
    @Approved BIT = 0,
    @FechaEvento DATETIMEOFFSET = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, 'NIO'))));
    SET @RequestJson = ISNULL(@RequestJson, '');
    SET @ResponseJson = ISNULL(@ResponseJson, '');
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @SpiToken = LTRIM(RTRIM(ISNULL(@SpiToken, '')));

    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50001, 'OrderId es requerido.', 1;

    IF @Monto <= 0
        THROW 50002, 'Monto inválido.', 1;

    IF @Moneda = ''
        THROW 50003, 'Moneda requerida.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        Monto,
        Moneda,
        Approved,
        SpiToken,
        IsoResponseCode,
        ResponseMessage,
        RequestJson,
        ResponseJson,
        FechaEvento
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'INIT',
        'INICIADO',
        @Monto,
        @Moneda,
        @Approved,
        @SpiToken,
        @IsoResponseCode,
        @ResponseMessage,
        @RequestJson,
        @ResponseJson,
        @FechaEvento
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END


USE [PCGCOMPANIES]
GO
/****** Object:  StoredProcedure [dbo].[sp_Powertranz_LogMerchantResponse]    Script Date: 4/22/2026 7:18:18 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER   PROCEDURE [dbo].[sp_Powertranz_LogMerchantResponse]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @MerchantResponseJson NVARCHAR(MAX),
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @MerchantRequestJson NVARCHAR(MAX) = '',
    @SpiToken NVARCHAR(250) = NULL,
    @CardBrand NVARCHAR(50) = NULL,
    @PanToken NVARCHAR(250) = NULL,
    @ThreeDSAuthStatus NVARCHAR(10) = NULL,
    @ThreeDSEci NVARCHAR(20) = NULL,
    @ThreeDSCavv NVARCHAR(200) = NULL,
    @FraudCode NVARCHAR(20) = NULL,
    @FraudScore NVARCHAR(20) = NULL,
    @Approved BIT = 0,
    @FechaEvento DATETIMEOFFSET = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = ''
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @EstadoAnterior NVARCHAR(50);

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @MerchantResponseJson = ISNULL(@MerchantResponseJson, '');
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @SpiToken = LTRIM(RTRIM(ISNULL(@SpiToken, '')));
    SET @CardBrand = LTRIM(RTRIM(ISNULL(@CardBrand, '')));
    SET @PanToken = LTRIM(RTRIM(ISNULL(@PanToken, '')));
    SET @ThreeDSAuthStatus = LTRIM(RTRIM(ISNULL(@ThreeDSAuthStatus, '')));
    SET @ThreeDSEci = LTRIM(RTRIM(ISNULL(@ThreeDSEci, '')));
    SET @ThreeDSCavv = LTRIM(RTRIM(ISNULL(@ThreeDSCavv, '')));
    SET @FraudCode = LTRIM(RTRIM(ISNULL(@FraudCode, '')));
    SET @FraudScore = LTRIM(RTRIM(ISNULL(@FraudScore, '')));
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, ''))));

    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50010, 'OrderId es requerido.', 1;

    IF @MerchantResponseJson = ''
        THROW 50011, 'MerchantResponseJson es requerido.', 1;

    SELECT TOP 1
        @EstadoAnterior = Estado
    FROM dbo.PowertranzEventosLog
    WHERE EmpresaId = @EmpresaId
      AND OrderId = @OrderId
    ORDER BY Id DESC;

    IF @EstadoAnterior IS NULL
        THROW 50012, 'No existe INIT previo para ese OrderId en esa empresa.', 1;

    IF @EstadoAnterior IN ('CAPTURADO', 'ANULADO', 'REEMBOLSADO')
        THROW 50013, 'La transacción ya está cerrada.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        Approved,
        SpiToken,
        IsoResponseCode,
        RequestJson,
        ResponseMessage,
        CardBrand,
        PanToken,
        ThreeDSAuthStatus,
        ThreeDSEci,
        ThreeDSCavv,
        FraudCode,
        FraudScore,
        ResponseJson,
        FechaEvento,
        Moneda,
        Monto
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'MERCHANT_RESPONSE',
        CASE WHEN @IsoResponseCode IN ('HP0', '3D0', 'SP1') THEN 'AUTENTICADO' ELSE 'FALLIDO' END,
        @Approved,
        @SpiToken,
        @IsoResponseCode,
        @MerchantRequestJson,
        @ResponseMessage,
        @CardBrand,
        @PanToken,
        @ThreeDSAuthStatus,
        @ThreeDSEci,
        @ThreeDSCavv,
        @FraudCode,
        @FraudScore,
        @MerchantResponseJson,
        @FechaEvento,
        @Moneda,
        @Monto
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END
USE [PCGCOMPANIES]
GO
/****** Object:  StoredProcedure [dbo].[sp_Powertranz_LogPayment]    Script Date: 4/22/2026 7:19:05 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER   PROCEDURE [dbo].[sp_Powertranz_LogPayment]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @Approved BIT,
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @PaymentRequestJson NVARCHAR(MAX) = '',
    @PaymentResponseJson NVARCHAR(MAX) = NULL,
    @CardBrand NVARCHAR(50) = NULL,
    @AuthorizationCode NVARCHAR(50) = NULL,
    @RRN NVARCHAR(250) = NULL,
    @PanToken NVARCHAR(250) = NULL,
    @Cvv2ResponseCode NVARCHAR(20) = NULL,
    @FechaEvento DATETIMEOFFSET = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = ''
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @EstadoAnterior NVARCHAR(50);

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @PaymentResponseJson = ISNULL(@PaymentResponseJson, '');
    SET @CardBrand = LTRIM(RTRIM(ISNULL(@CardBrand, '')));
    SET @AuthorizationCode = LTRIM(RTRIM(ISNULL(@AuthorizationCode, '')));
    SET @RRN = LTRIM(RTRIM(ISNULL(@RRN, '')));
    SET @PanToken = LTRIM(RTRIM(ISNULL(@PanToken, '')));
    SET @Cvv2ResponseCode = LTRIM(RTRIM(ISNULL(@Cvv2ResponseCode, '')));
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, ''))));

    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50020, 'OrderId es requerido.', 1;

    SELECT TOP 1
        @EstadoAnterior = Estado
    FROM dbo.PowertranzEventosLog
    WHERE EmpresaId = @EmpresaId
      AND OrderId = @OrderId
    ORDER BY Id DESC;

    IF @EstadoAnterior IS NULL
        THROW 50021, 'No existe transacción previa para ese OrderId en esa empresa.', 1;

    IF @EstadoAnterior IN ('CAPTURADO', 'ANULADO', 'REEMBOLSADO')
        THROW 50022, 'La transacción ya está cerrada.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        Approved,
        IsoResponseCode,
        RequestJson,
        ResponseMessage,
        CardBrand,
        AuthorizationCode,
        RRN,
        PanToken,
        Cvv2ResponseCode,
        ResponseJson,
        FechaEvento,
        Moneda,
        Monto
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'PAYMENT',
        CASE WHEN @Approved = 1 THEN 'PAGADO' ELSE 'FALLIDO' END,
        @Approved,
        @IsoResponseCode,
        @PaymentRequestJson,
        @ResponseMessage,
        @CardBrand,
        @AuthorizationCode,
        @RRN,
        @PanToken,
        @Cvv2ResponseCode,
        @PaymentResponseJson,
        @FechaEvento,
        @Moneda,
        @Monto
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END
USE [PCGCOMPANIES]
GO
/****** Object:  StoredProcedure [dbo].[sp_Powertranz_LogCapture]    Script Date: 4/22/2026 7:19:45 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER   PROCEDURE [dbo].[sp_Powertranz_LogCapture]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @Approved BIT,
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @CaptureRequestJson NVARCHAR(MAX) = '',
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @CaptureResponseJson NVARCHAR(MAX) = NULL,
    @AuthorizationCode NVARCHAR(50) = NULL,
    @FechaEvento DATETIMEOFFSET = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = ''
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @EstadoAnterior NVARCHAR(50);

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @CaptureResponseJson = ISNULL(@CaptureResponseJson, '');
    SET @AuthorizationCode = LTRIM(RTRIM(ISNULL(@AuthorizationCode, '')));
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, ''))));

    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50030, 'OrderId es requerido.', 1;

    SELECT TOP 1
        @EstadoAnterior = Estado
    FROM dbo.PowertranzEventosLog
    WHERE EmpresaId = @EmpresaId
      AND OrderId = @OrderId
    ORDER BY Id DESC;

    IF @EstadoAnterior IS NULL
        THROW 50031, 'No existe transacción previa para ese OrderId en esa empresa.', 1;

    IF @EstadoAnterior <> 'PAGADO'
        THROW 50032, 'Solo una transacción PAGADA permite CAPTURE.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        Approved,
        IsoResponseCode,
        ResponseMessage,
        AuthorizationCode,
        RequestJson,
        ResponseJson,
        FechaEvento,
        Moneda,
        Monto
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'CAPTURE',
        CASE WHEN @Approved = 1 THEN 'CAPTURADO' ELSE 'FALLIDO' END,
        @Approved,
        @IsoResponseCode,
        @ResponseMessage,
        @AuthorizationCode,
        @CaptureRequestJson,
        @CaptureResponseJson,
        @FechaEvento,
        @Moneda,
        @Monto
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END
USE [PCGCOMPANIES]
GO
/****** Object:  StoredProcedure [dbo].[sp_Powertranz_LogVoid]    Script Date: 4/22/2026 7:20:26 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER   PROCEDURE [dbo].[sp_Powertranz_LogVoid]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @Approved BIT,
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @VoidRequestJson NVARCHAR(MAX) = '',
    @VoidResponseJson NVARCHAR(MAX) = NULL,
    @FechaEvento DATETIMEOFFSET = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = ''
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @EstadoAnterior NVARCHAR(50);

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @VoidResponseJson = ISNULL(@VoidResponseJson, '');
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, ''))));
    
    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50040, 'OrderId es requerido.', 1;

    SELECT TOP 1
        @EstadoAnterior = Estado
    FROM dbo.PowertranzEventosLog
    WHERE EmpresaId = @EmpresaId
      AND OrderId = @OrderId
    ORDER BY Id DESC;

    IF @EstadoAnterior IS NULL
        THROW 50041, 'No existe transacción previa para ese OrderId en esa empresa.', 1;

    IF @EstadoAnterior IN ('ANULADO', 'REEMBOLSADO', 'CAPTURADO')
        THROW 50042, 'El estado actual no permite VOID.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        Approved,
        IsoResponseCode,
        ResponseMessage,
        RequestJson,
        ResponseJson,
        FechaEvento,
        Moneda,
        Monto
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'VOID',
        CASE WHEN @Approved = 1 THEN 'ANULADO' ELSE 'FALLIDO' END,
        @Approved,
        @IsoResponseCode,
        @ResponseMessage,
        @VoidRequestJson,
        @VoidResponseJson,
        @FechaEvento,
        @Moneda,
        @Monto
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END
USE [PCGCOMPANIES]
GO
/****** Object:  StoredProcedure [dbo].[sp_Powertranz_LogRefund]    Script Date: 4/22/2026 7:21:08 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER   PROCEDURE [dbo].[sp_Powertranz_LogRefund]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @Approved BIT,
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @RefundRequestJson NVARCHAR(MAX) = '',
    @RefundResponseJson NVARCHAR(MAX) = NULL,
    @FechaEvento DATETIMEOFFSET = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = ''
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @EstadoAnterior NVARCHAR(50);

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @RefundResponseJson = ISNULL(@RefundResponseJson, '');
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, ''))));
    
    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50050, 'OrderId es requerido.', 1;

    SELECT TOP 1
        @EstadoAnterior = Estado
    FROM dbo.PowertranzEventosLog
    WHERE EmpresaId = @EmpresaId
      AND OrderId = @OrderId
    ORDER BY Id DESC;

    IF @EstadoAnterior IS NULL
        THROW 50051, 'No existe transacción previa para ese OrderId en esa empresa.', 1;

    IF @EstadoAnterior NOT IN ('PAGADO', 'CAPTURADO')
        THROW 50052, 'Solo una transacción PAGADA o CAPTURADA permite REFUND.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        Approved,
        IsoResponseCode,
        ResponseMessage,
        RequestJson,
        ResponseJson,
        FechaEvento,
        Moneda,
        Monto
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'REFUND',
        CASE WHEN @Approved = 1 THEN 'REEMBOLSADO' ELSE 'FALLIDO' END,
        @Approved,
        @IsoResponseCode,
        @ResponseMessage,
        @RefundRequestJson,
        @RefundResponseJson,
        @FechaEvento,
        @Moneda,
        @Monto
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END
USE [PCGCOMPANIES]
GO
/****** Object:  StoredProcedure [dbo].[sp_Powertranz_LogError]    Script Date: 4/22/2026 7:21:59 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER   PROCEDURE [dbo].[sp_Powertranz_LogError]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @ErrorMessage NVARCHAR(MAX),
    @ErrorStack NVARCHAR(MAX) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @RequestJson NVARCHAR(MAX) = '',
    @ResponseJson NVARCHAR(MAX) = NULL,
    @FechaEvento DATETIMEOFFSET = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = ''
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @ErrorMessage = ISNULL(@ErrorMessage, '');
    SET @ErrorStack = ISNULL(@ErrorStack, '');
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @ResponseJson = ISNULL(@ResponseJson, '');
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, ''))));

    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50060, 'OrderId es requerido.', 1;

    IF @ErrorMessage = ''
        THROW 50061, 'ErrorMessage es requerido.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        IsoResponseCode,
        ResponseMessage,
        RequestJson,
        ResponseJson,
        ErrorMessage,
        ErrorStack,
        FechaEvento,
        Moneda,
        Monto
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'ERROR',
        'FALLIDO',
        @IsoResponseCode,
        @ResponseMessage,
        @RequestJson,
        @ResponseJson,
        @ErrorMessage,
        @ErrorStack,
        @FechaEvento,
        @Moneda,
        @Monto
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END





USE [PCGCOMPANIES]
GO

IF COL_LENGTH('dbo.PowertranzEventosLog', 'FlowType') IS NULL
BEGIN
    ALTER TABLE dbo.PowertranzEventosLog
    ADD FlowType NVARCHAR(50) NULL;
END
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[sp_Powertranz_LogInit]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = 'NIO',
    @RequestJson NVARCHAR(MAX) = NULL,
    @ResponseJson NVARCHAR(MAX) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @SpiToken NVARCHAR(250) = NULL,
    @Approved BIT = 0,
    @FlowType NVARCHAR(50) = NULL,
    @FechaEvento DATETIMEOFFSET = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, 'NIO'))));
    SET @RequestJson = ISNULL(@RequestJson, '');
    SET @ResponseJson = ISNULL(@ResponseJson, '');
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @SpiToken = LTRIM(RTRIM(ISNULL(@SpiToken, '')));
    SET @FlowType = UPPER(LTRIM(RTRIM(ISNULL(@FlowType, ''))));

    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50001, 'OrderId es requerido.', 1;

    IF @Monto <= 0
        THROW 50002, 'Monto inválido.', 1;

    IF @Moneda = ''
        THROW 50003, 'Moneda requerida.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        Monto,
        Moneda,
        Approved,
        SpiToken,
        IsoResponseCode,
        ResponseMessage,
        RequestJson,
        ResponseJson,
        FlowType,
        FechaEvento
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'INIT',
        'INICIADO',
        @Monto,
        @Moneda,
        @Approved,
        @SpiToken,
        @IsoResponseCode,
        @ResponseMessage,
        @RequestJson,
        @ResponseJson,
        NULLIF(@FlowType, ''),
        @FechaEvento
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END
GO

ALTER PROCEDURE [dbo].[sp_Powertranz_LogMerchantResponse]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @MerchantResponseJson NVARCHAR(MAX),
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @MerchantRequestJson NVARCHAR(MAX) = '',
    @SpiToken NVARCHAR(250) = NULL,
    @CardBrand NVARCHAR(50) = NULL,
    @PanToken NVARCHAR(250) = NULL,
    @ThreeDSAuthStatus NVARCHAR(10) = NULL,
    @ThreeDSEci NVARCHAR(20) = NULL,
    @ThreeDSCavv NVARCHAR(200) = NULL,
    @FraudCode NVARCHAR(20) = NULL,
    @FraudScore NVARCHAR(20) = NULL,
    @Approved BIT = 0,
    @FlowType NVARCHAR(50) = NULL,
    @FechaEvento DATETIMEOFFSET = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = ''
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @EstadoAnterior NVARCHAR(50);

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @MerchantResponseJson = ISNULL(@MerchantResponseJson, '');
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @SpiToken = LTRIM(RTRIM(ISNULL(@SpiToken, '')));
    SET @CardBrand = LTRIM(RTRIM(ISNULL(@CardBrand, '')));
    SET @PanToken = LTRIM(RTRIM(ISNULL(@PanToken, '')));
    SET @ThreeDSAuthStatus = LTRIM(RTRIM(ISNULL(@ThreeDSAuthStatus, '')));
    SET @ThreeDSEci = LTRIM(RTRIM(ISNULL(@ThreeDSEci, '')));
    SET @ThreeDSCavv = LTRIM(RTRIM(ISNULL(@ThreeDSCavv, '')));
    SET @FraudCode = LTRIM(RTRIM(ISNULL(@FraudCode, '')));
    SET @FraudScore = LTRIM(RTRIM(ISNULL(@FraudScore, '')));
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, ''))));
    SET @FlowType = UPPER(LTRIM(RTRIM(ISNULL(@FlowType, ''))));

    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50010, 'OrderId es requerido.', 1;

    IF @MerchantResponseJson = ''
        THROW 50011, 'MerchantResponseJson es requerido.', 1;

    SELECT TOP 1
        @EstadoAnterior = Estado
    FROM dbo.PowertranzEventosLog
    WHERE EmpresaId = @EmpresaId
      AND OrderId = @OrderId
    ORDER BY Id DESC;

    IF @EstadoAnterior IS NULL
        THROW 50012, 'No existe INIT previo para ese OrderId en esa empresa.', 1;

    IF @EstadoAnterior IN ('CAPTURADO', 'ANULADO', 'REEMBOLSADO')
        THROW 50013, 'La transacción ya está cerrada.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        Approved,
        SpiToken,
        IsoResponseCode,
        RequestJson,
        ResponseMessage,
        CardBrand,
        PanToken,
        ThreeDSAuthStatus,
        ThreeDSEci,
        ThreeDSCavv,
        FraudCode,
        FraudScore,
        ResponseJson,
        FlowType,
        FechaEvento,
        Moneda,
        Monto
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'MERCHANT_RESPONSE',
        CASE WHEN @IsoResponseCode IN ('HP0', '3D0', 'SP1') THEN 'AUTENTICADO' ELSE 'FALLIDO' END,
        @Approved,
        @SpiToken,
        @IsoResponseCode,
        @MerchantRequestJson,
        @ResponseMessage,
        @CardBrand,
        @PanToken,
        @ThreeDSAuthStatus,
        @ThreeDSEci,
        @ThreeDSCavv,
        @FraudCode,
        @FraudScore,
        @MerchantResponseJson,
        NULLIF(@FlowType, ''),
        @FechaEvento,
        @Moneda,
        @Monto
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END
GO

ALTER PROCEDURE [dbo].[sp_Powertranz_LogPayment]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @Approved BIT,
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @PaymentRequestJson NVARCHAR(MAX) = '',
    @PaymentResponseJson NVARCHAR(MAX) = NULL,
    @CardBrand NVARCHAR(50) = NULL,
    @AuthorizationCode NVARCHAR(50) = NULL,
    @RRN NVARCHAR(250) = NULL,
    @PanToken NVARCHAR(250) = NULL,
    @Cvv2ResponseCode NVARCHAR(20) = NULL,
    @FlowType NVARCHAR(50) = NULL,
    @FechaEvento DATETIMEOFFSET = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = ''
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @EstadoAnterior NVARCHAR(50);

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @PaymentResponseJson = ISNULL(@PaymentResponseJson, '');
    SET @CardBrand = LTRIM(RTRIM(ISNULL(@CardBrand, '')));
    SET @AuthorizationCode = LTRIM(RTRIM(ISNULL(@AuthorizationCode, '')));
    SET @RRN = LTRIM(RTRIM(ISNULL(@RRN, '')));
    SET @PanToken = LTRIM(RTRIM(ISNULL(@PanToken, '')));
    SET @Cvv2ResponseCode = LTRIM(RTRIM(ISNULL(@Cvv2ResponseCode, '')));
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, ''))));
    SET @FlowType = UPPER(LTRIM(RTRIM(ISNULL(@FlowType, ''))));

    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50020, 'OrderId es requerido.', 1;

    SELECT TOP 1
        @EstadoAnterior = Estado
    FROM dbo.PowertranzEventosLog
    WHERE EmpresaId = @EmpresaId
      AND OrderId = @OrderId
    ORDER BY Id DESC;

    IF @EstadoAnterior IS NULL
        THROW 50021, 'No existe transacción previa para ese OrderId en esa empresa.', 1;

    IF @EstadoAnterior IN ('CAPTURADO', 'ANULADO', 'REEMBOLSADO')
        THROW 50022, 'La transacción ya está cerrada.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        Approved,
        IsoResponseCode,
        RequestJson,
        ResponseMessage,
        CardBrand,
        AuthorizationCode,
        RRN,
        PanToken,
        Cvv2ResponseCode,
        ResponseJson,
        FlowType,
        FechaEvento,
        Moneda,
        Monto
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'PAYMENT',
        CASE WHEN @Approved = 1 THEN 'PAGADO' ELSE 'FALLIDO' END,
        @Approved,
        @IsoResponseCode,
        @PaymentRequestJson,
        @ResponseMessage,
        @CardBrand,
        @AuthorizationCode,
        @RRN,
        @PanToken,
        @Cvv2ResponseCode,
        @PaymentResponseJson,
        NULLIF(@FlowType, ''),
        @FechaEvento,
        @Moneda,
        @Monto
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END
GO

ALTER PROCEDURE [dbo].[sp_Powertranz_LogCapture]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @Approved BIT,
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @CaptureRequestJson NVARCHAR(MAX) = '',
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @CaptureResponseJson NVARCHAR(MAX) = NULL,
    @AuthorizationCode NVARCHAR(50) = NULL,
    @FechaEvento DATETIMEOFFSET = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = ''
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @EstadoAnterior NVARCHAR(50);

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @CaptureResponseJson = ISNULL(@CaptureResponseJson, '');
    SET @AuthorizationCode = LTRIM(RTRIM(ISNULL(@AuthorizationCode, '')));
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, ''))));

    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50030, 'OrderId es requerido.', 1;

    SELECT TOP 1
        @EstadoAnterior = Estado
    FROM dbo.PowertranzEventosLog
    WHERE EmpresaId = @EmpresaId
      AND OrderId = @OrderId
    ORDER BY Id DESC;

    IF @EstadoAnterior IS NULL
        THROW 50031, 'No existe transacción previa para ese OrderId en esa empresa.', 1;

    IF @EstadoAnterior <> 'PAGADO'
        THROW 50032, 'Solo una transacción PAGADA permite CAPTURE.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        Approved,
        IsoResponseCode,
        ResponseMessage,
        AuthorizationCode,
        RequestJson,
        ResponseJson,
        FechaEvento,
        Moneda,
        Monto
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'CAPTURE',
        CASE WHEN @Approved = 1 THEN 'CAPTURADO' ELSE 'FALLIDO' END,
        @Approved,
        @IsoResponseCode,
        @ResponseMessage,
        @AuthorizationCode,
        @CaptureRequestJson,
        @CaptureResponseJson,
        @FechaEvento,
        @Moneda,
        @Monto
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END
GO

ALTER PROCEDURE [dbo].[sp_Powertranz_LogVoid]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @Approved BIT,
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @VoidRequestJson NVARCHAR(MAX) = '',
    @VoidResponseJson NVARCHAR(MAX) = NULL,
    @FechaEvento DATETIMEOFFSET = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = ''
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @EstadoAnterior NVARCHAR(50);

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @VoidResponseJson = ISNULL(@VoidResponseJson, '');
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, ''))));
    
    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50040, 'OrderId es requerido.', 1;

    SELECT TOP 1
        @EstadoAnterior = Estado
    FROM dbo.PowertranzEventosLog
    WHERE EmpresaId = @EmpresaId
      AND OrderId = @OrderId
    ORDER BY Id DESC;

    IF @EstadoAnterior IS NULL
        THROW 50041, 'No existe transacción previa para ese OrderId en esa empresa.', 1;

    IF @EstadoAnterior IN ('ANULADO', 'REEMBOLSADO', 'CAPTURADO')
        THROW 50042, 'El estado actual no permite VOID.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        Approved,
        IsoResponseCode,
        ResponseMessage,
        RequestJson,
        ResponseJson,
        FechaEvento,
        Moneda,
        Monto
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'VOID',
        CASE WHEN @Approved = 1 THEN 'ANULADO' ELSE 'FALLIDO' END,
        @Approved,
        @IsoResponseCode,
        @ResponseMessage,
        @VoidRequestJson,
        @VoidResponseJson,
        @FechaEvento,
        @Moneda,
        @Monto
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END
GO

ALTER PROCEDURE [dbo].[sp_Powertranz_LogRefund]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @Approved BIT,
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @RefundRequestJson NVARCHAR(MAX) = '',
    @RefundResponseJson NVARCHAR(MAX) = NULL,
    @FechaEvento DATETIMEOFFSET = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = ''
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @EstadoAnterior NVARCHAR(50);

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @RefundResponseJson = ISNULL(@RefundResponseJson, '');
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, ''))));
    
    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50050, 'OrderId es requerido.', 1;

    SELECT TOP 1
        @EstadoAnterior = Estado
    FROM dbo.PowertranzEventosLog
    WHERE EmpresaId = @EmpresaId
      AND OrderId = @OrderId
    ORDER BY Id DESC;

    IF @EstadoAnterior IS NULL
        THROW 50051, 'No existe transacción previa para ese OrderId en esa empresa.', 1;

    IF @EstadoAnterior NOT IN ('PAGADO', 'CAPTURADO')
        THROW 50052, 'Solo una transacción PAGADA o CAPTURADA permite REFUND.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        Approved,
        IsoResponseCode,
        ResponseMessage,
        RequestJson,
        ResponseJson,
        FechaEvento,
        Moneda,
        Monto
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'REFUND',
        CASE WHEN @Approved = 1 THEN 'REEMBOLSADO' ELSE 'FALLIDO' END,
        @Approved,
        @IsoResponseCode,
        @ResponseMessage,
        @RefundRequestJson,
        @RefundResponseJson,
        @FechaEvento,
        @Moneda,
        @Monto
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END
GO

ALTER PROCEDURE [dbo].[sp_Powertranz_LogError]
(
    @EmpresaId INT,
    @OrderId NVARCHAR(250),
    @ExternalIdentifier NVARCHAR(250) = NULL,
    @ErrorMessage NVARCHAR(MAX),
    @ErrorStack NVARCHAR(MAX) = NULL,
    @IsoResponseCode NVARCHAR(50) = NULL,
    @ResponseMessage NVARCHAR(MAX) = NULL,
    @RequestJson NVARCHAR(MAX) = '',
    @ResponseJson NVARCHAR(MAX) = NULL,
    @FlowType NVARCHAR(50) = NULL,
    @FechaEvento DATETIMEOFFSET = NULL,
    @Monto DECIMAL(18,2) = 0,
    @Moneda NVARCHAR(10) = ''
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @OrderId = LTRIM(RTRIM(ISNULL(@OrderId, '')));
    SET @ExternalIdentifier = LTRIM(RTRIM(ISNULL(@ExternalIdentifier, '')));
    SET @ErrorMessage = ISNULL(@ErrorMessage, '');
    SET @ErrorStack = ISNULL(@ErrorStack, '');
    SET @IsoResponseCode = LTRIM(RTRIM(ISNULL(@IsoResponseCode, '')));
    SET @ResponseMessage = ISNULL(@ResponseMessage, '');
    SET @ResponseJson = ISNULL(@ResponseJson, '');
    SET @Moneda = UPPER(LTRIM(RTRIM(ISNULL(@Moneda, ''))));
    SET @FlowType = UPPER(LTRIM(RTRIM(ISNULL(@FlowType, ''))));

    IF @FechaEvento IS NULL
        SET @FechaEvento = SYSDATETIMEOFFSET() AT TIME ZONE 'Central America Standard Time';

    IF ISNULL(@EmpresaId, 0) <= 0
        THROW 50999, 'EmpresaId es requerido y debe ser mayor que cero.', 1;

    IF @OrderId = ''
        THROW 50060, 'OrderId es requerido.', 1;

    IF @ErrorMessage = ''
        THROW 50061, 'ErrorMessage es requerido.', 1;

    INSERT INTO dbo.PowertranzEventosLog
    (
        EmpresaId,
        OrderId,
        ExternalIdentifier,
        Evento,
        Estado,
        IsoResponseCode,
        ResponseMessage,
        RequestJson,
        ResponseJson,
        ErrorMessage,
        ErrorStack,
        FlowType,
        FechaEvento,
        Moneda,
        Monto
    )
    VALUES
    (
        @EmpresaId,
        @OrderId,
        @ExternalIdentifier,
        'ERROR',
        'FALLIDO',
        @IsoResponseCode,
        @ResponseMessage,
        @RequestJson,
        @ResponseJson,
        @ErrorMessage,
        @ErrorStack,
        NULLIF(@FlowType, ''),
        @FechaEvento,
        @Moneda,
        @Monto
    );

    SELECT TOP 1 *
    FROM dbo.PowertranzEventosLog
    WHERE Id = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ObtenerFlowTypePorOrderId]
(
    @OrderId NVARCHAR(250)
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 FlowType
    FROM dbo.PowertranzEventosLog
    WHERE OrderId = @OrderId
      AND FlowType IS NOT NULL
      AND FlowType <> ''
    ORDER BY Id DESC;
END
GO




