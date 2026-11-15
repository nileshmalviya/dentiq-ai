import { ok, wrap } from '../middleware/index.js';
import type { DocumentService } from '../services/document.service.js';
export class DocumentController {
  constructor(private service: DocumentService) {}
  upload = wrap(async (req, res) =>
    ok(
      res,
      await this.service.upload(req.actor!, req.body.documentType, req.file),
      201,
    ),
  );
  list = wrap(async (req, res) =>
    ok(res, await this.service.adminList(req.actor!, String(req.params.id))),
  );
  download = wrap(async (req, res) => {
    const file = await this.service.download(
      req.actor!,
      String(req.params.id),
      String(req.params.documentId),
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.type(file.mime);
    await new Promise<void>((resolve, reject) =>
      res.download(file.path, file.name, (error) =>
        error ? reject(error) : resolve(),
      ),
    );
  });
}
