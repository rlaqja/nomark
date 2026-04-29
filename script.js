/**
 * 보안 및 이미지 처리 툴 핵심 로직
 */

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. TXT 파일 보안 필터링 관련 요소 및 변수
    // ---------------------------------------------------------
    const txtInput = document.getElementById('txt-file-input');
    const txtFileNameDisplay = document.getElementById('txt-file-name');
    const processTxtBtn = document.getElementById('process-txt-btn');
    const downloadTxtBtn = document.getElementById('download-txt-btn');
    const txtPreview = document.getElementById('txt-preview');

    // 보안 키워드 리스트
    const securityKeywords = ["회사명", "프로젝트명", "IP", "내부", "기밀", "confidential"];
    let processedTxtContent = "";

    // 파일 선택 시 이름 표시
    txtInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            txtFileNameDisplay.textContent = file.name;
            downloadTxtBtn.disabled = true; // 새 파일 선택 시 다운로드 버튼 초기화
        }
    });

    // 텍스트 처리 로직
    processTxtBtn.addEventListener('click', () => {
        const file = txtInput.files[0];
        if (!file) {
            alert('먼저 텍스트 파일을 선택해주세요.');
            return;
        }

        const mode = document.querySelector('input[name="filter-mode"]:checked').value;
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            const lines = content.split(/\r?\n/);
            let resultLines = [];

            lines.forEach(line => {
                let currentLine = line;
                let hasKeyword = false;

                // 해당 줄에 키워드가 있는지 검사
                securityKeywords.forEach(keyword => {
                    if (currentLine.includes(keyword)) {
                        hasKeyword = true;
                        if (mode === 'mask') {
                            // 키워드만 마스킹 처리 (정규표현식 사용하여 전체 변경)
                            const regex = new RegExp(keyword, 'g');
                            currentLine = currentLine.replace(regex, '***');
                        }
                    }
                });

                // 처리 모드에 따라 결정
                if (mode === 'delete') {
                    if (!hasKeyword) {
                        resultLines.push(currentLine);
                    }
                } else {
                    resultLines.push(currentLine);
                }
            });

            processedTxtContent = resultLines.join('\n');
            
            // 미리보기 업데이트
            txtPreview.textContent = processedTxtContent;
            
            // 다운로드 버튼 활성화
            downloadTxtBtn.disabled = false;
        };

        reader.readAsText(file);
    });

    // 텍스트 파일 다운로드
    downloadTxtBtn.addEventListener('click', () => {
        if (!processedTxtContent) return;

        const blob = new Blob([processedTxtContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'filtered_result.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });


    // ---------------------------------------------------------
    // 2. 이미지 패턴 제거 (Red Defect 추출) 관련 요소 및 변수
    // ---------------------------------------------------------
    const imgInput = document.getElementById('img-file-input');
    const imgFileNameDisplay = document.getElementById('img-file-name');
    const processImgBtn = document.getElementById('process-img-btn');
    const downloadImgBtn = document.getElementById('download-img-btn');
    const canvas = document.getElementById('result-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // 이미지 선택 시 이름 표시
    imgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            imgFileNameDisplay.textContent = file.name;
            downloadImgBtn.disabled = true;
        }
    });

    // 이미지 처리 로직
    processImgBtn.addEventListener('click', () => {
        const file = imgInput.files[0];
        if (!file) {
            alert('먼저 이미지 파일을 선택해주세요.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // 캔버스 크기를 이미지 크기에 맞춤
                canvas.width = img.width;
                canvas.height = img.height;

                // 캔버스에 원본 이미지 그리기
                ctx.drawImage(img, 0, 0);

                // 픽셀 데이터 가져오기
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                /**
                 * 픽셀 단위 필터링 로직
                 * data 배열 구조: [R, G, B, A, R, G, B, A, ...]
                 */
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];     // Red
                    const g = data[i + 1]; // Green
                    const b = data[i + 2]; // Blue

                    // 요구사항: R > 150 && G < 100 && B < 100 이면 유지, 아니면 흰색
                    if (r > 150 && g < 100 && b < 100) {
                        // 빨간색(Defect) 유지: 별도 조작 없음
                    } else {
                        // 나머지 배경은 흰색으로 변경
                        data[i] = 255;     // R
                        data[i + 1] = 255; // G
                        data[i + 2] = 255; // B
                    }
                }

                // 수정된 데이터 다시 그리기
                ctx.putImageData(imageData, 0, 0);
                
                // 다운로드 버튼 활성화
                downloadImgBtn.disabled = false;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // 이미지 파일 다운로드 (PNG)
    downloadImgBtn.addEventListener('click', () => {
        const dataURL = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'defect_filtered_image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});
