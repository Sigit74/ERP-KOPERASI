export const openApiYaml = `openapi: 3.0.0
info:
  title: SIMULTAN ERP API
  version: 1.0.0
  description: >
    Dokumentasi REST API untuk sistem ERP Koperasi SIMULTAN.
    Backend menggunakan Supabase (PostgREST). Endpoint di bawah ini merepresentasikan
    interface yang tersedia untuk klien Web dan Mobile.
servers:
  - url: https://{project-ref}.supabase.co/rest/v1
    description: Production Server (Supabase Auto-REST)
  - url: https://api.simultan.id/v1
    description: Custom Backend / Edge Functions
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Masukkan Access Token dari Supabase Auth.
  schemas:
    Farmer:
      type: object
      required: [name, group_id]
      properties:
        id:
          type: string
          format: uuid
          readOnly: true
        name:
          type: string
          example: "Budi Santoso"
        nik:
          type: string
          example: "3201123456780001"
        phone:
          type: string
          example: "08123456789"
        address:
          type: string
        status:
          type: string
          enum: [active, inactive, banned]
          default: active
    
    PurchaseTransactionPayload:
      type: object
      required:
        - farmer_id
        - product_id
        - warehouse_id
        - quantity
        - price_per_unit
      properties:
        farmer_id:
          type: string
          format: uuid
          description: ID Petani penjual
        product_id:
          type: string
          format: uuid
          description: ID Produk (Kopi, Pupuk, dll)
        warehouse_id:
          type: string
          format: uuid
          description: ID Gudang tujuan
        quantity:
          type: number
          minimum: 0
          description: Jumlah berat (KG)
          example: 100.5
        price_per_unit:
          type: number
          minimum: 0
          description: Harga satuan per unit (Rupiah)
          example: 85000
        notes:
          type: string
          description: Catatan tambahan transaksi
          example: "Kualitas Grade A"

security:
  - bearerAuth: []

paths:
  /auth/login:
    post:
      summary: Login Pengguna
      tags: [Auth]
      description: >
        Endpoint ini biasanya ditangani oleh Supabase Auth Client SDK.
        Secara REST, ini memanggil /auth/v1/token?grant_type=password.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                  example: "officer@simultan.id"
                password:
                  type: string
                  format: password
                  example: "rahasia123"
      responses:
        '200':
          description: Login berhasil. Mengembalikan Access Token (JWT).
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token: {type: string}
                  token_type: {type: string, example: "bearer"}
                  user: {type: object}

  /auth/signup:
    post:
      summary: Registrasi User Baru (Admin Only)
      tags: [Auth]
      description: >
        Mendaftarkan pengguna baru (Field Officer/Accountant). 
        Endpoint ini dibatasi hanya untuk role Admin via Edge Function atau Server-side logic.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, role]
              properties:
                email: {type: string, format: email}
                password: {type: string}
                role: 
                  type: string
                  enum: [field_officer, accountant]
      responses:
        '201':
          description: User created successfully.

  /farmers:
    get:
      summary: Ambil Daftar Petani
      tags: [Farmers]
      parameters:
        - in: query
          name: select
          schema: {type: string}
          description: Kolom yang ingin diambil (contoh: id,name,status)
        - in: query
          name: name
          schema: {type: string}
          description: Filter berdasarkan nama (ilike)
      responses:
        '200':
          description: List data petani
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Farmer'
    post:
      summary: Tambah Petani Baru
      tags: [Farmers]
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Farmer'
      responses:
        '201':
          description: Created

  /farmers/{id}:
    put:
      summary: Update Data Petani
      tags: [Farmers]
      parameters:
        - in: path
          name: id
          required: true
          schema: {type: string, format: uuid}
      requestBody:
        content:
          application/json:
             schema:
               $ref: '#/components/schemas/Farmer'
      responses:
        '200':
          description: Updated
    delete:
      summary: Hapus Petani
      tags: [Farmers]
      parameters:
        - in: path
          name: id
          required: true
          schema: {type: string, format: uuid}
      responses:
        '204':
          description: No Content (Deleted)

  /farms:
    get:
      summary: List Data Kebun
      tags: [Farms]
      responses:
        '200':
          description: OK
    post:
      summary: Tambah Kebun Baru
      tags: [Farms]
      responses:
        '201':
          description: Created

  /purchase_transactions:
    get:
      summary: History Transaksi Pembelian
      tags: [Transactions]
      description: Mengambil riwayat transaksi. Field officer hanya melihat data miliknya (via RLS).
      responses:
        '200':
          description: List transaksi
    post:
      summary: Buat Transaksi Baru
      tags: [Transactions]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PurchaseTransactionPayload'
            example:
              farmer_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
              product_id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22"
              warehouse_id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33"
              quantity: 50.5
              price_per_unit: 85000
              notes: "Panen grade A"
      responses:
        '201':
          description: Transaksi berhasil disimpan.

  /files/upload:
    post:
      summary: Upload File ke Storage
      tags: [Storage]
      description: >
        Mengupload file (foto kebun, bukti transaksi) ke Supabase Storage Bucket.
        Mengembalikan Signed URL atau Public URL.
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                path:
                  type: string
                  example: "transactions/proofs/"
      responses:
        '200':
          description: Upload berhasil
          content:
            application/json:
              schema:
                type: object
                properties:
                  Key: {type: string}
                  URL: {type: string}
`;
